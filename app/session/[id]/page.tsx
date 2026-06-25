"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";
import { STYLES_MAP, STYLE_FACE_FIT, stripeBg } from "@/lib/styles-data";
import { createClient } from "@/lib/supabase/client";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const REMINDER_KEY = "hairstyle_reminder_v1";

function getReminderDate(sessionId: string): Date | null {
  try {
    const stored = JSON.parse(localStorage.getItem(REMINDER_KEY) ?? "{}");
    const iso = stored[sessionId];
    return iso ? new Date(iso) : null;
  } catch { return null; }
}

function saveReminder(sessionId: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(REMINDER_KEY) ?? "{}");
    const due = new Date();
    due.setDate(due.getDate() + 35);
    stored[sessionId] = due.toISOString();
    localStorage.setItem(REMINDER_KEY, JSON.stringify(stored));
    return due;
  } catch { return null; }
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// sessionStorage helpers so detail page can poll instead of duplicating generation
function imageUrlCacheKey(sessionId: string) { return `hs_img_${sessionId}`; }
function readImageUrlCache(sessionId: string): Record<string, string | null> {
  try { return JSON.parse(sessionStorage.getItem(imageUrlCacheKey(sessionId)) ?? "{}"); }
  catch { return {}; }
}
function writeImageUrlCache(sessionId: string, map: Record<string, string | null>) {
  try { sessionStorage.setItem(imageUrlCacheKey(sessionId), JSON.stringify(map)); }
  catch {}
}

function inflightKey(sessionId: string) { return `hs_inflight_${sessionId}`; }
function inflightAdd(sessionId: string, sids: string[]) {
  try {
    const set = new Set<string>(JSON.parse(sessionStorage.getItem(inflightKey(sessionId)) ?? "[]"));
    sids.forEach(s => set.add(s));
    sessionStorage.setItem(inflightKey(sessionId), JSON.stringify([...set]));
  } catch {}
}
function inflightRemove(sessionId: string, sid: string) {
  try {
    const set = new Set<string>(JSON.parse(sessionStorage.getItem(inflightKey(sessionId)) ?? "[]"));
    set.delete(sid);
    sessionStorage.setItem(inflightKey(sessionId), JSON.stringify([...set]));
  } catch {}
}

const ATTR_LABELS: Record<string, string> = {
  hair_type: "Hair",
  hair_density: "Density",
  forehead: "Forehead",
  jaw: "Jaw",
};

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const [imageUrls, setImageUrls]             = useState<Record<string, string | null>>({});
  const [faceShape, setFaceShape]             = useState<string | null>(null);
  const [selectedStyles, setSelected]         = useState<string[] | null>(null);
  const [hairAttributes, setHairAttrs]        = useState<Record<string, string> | null>(null);
  const [generatingStyles, setGenerating]     = useState<Record<string, boolean>>({});
  const [savedStyles, setSavedStyles]         = useState<Record<string, boolean>>({});
  const [barberStyles, setBarberStyles]       = useState<Record<string, boolean>>({});
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const [generatedCount, setGeneratedCount]   = useState(0);
  const [sessionCreatedAt, setCreatedAt]      = useState<string | null>(null);
  const [showBarberPrompt, setShowBarberPrompt] = useState(false);
  const [sessionNumber, setSessionNumber]       = useState<number | null>(null);
  const [reminderDate, setReminderDate]       = useState<Date | null>(null);
  const [reminderJustSet, setReminderJustSet] = useState(false);
  const [billingError, setBillingError]       = useState(false);

  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE || params.id === "demo") return;

    // Seed from cache immediately so images render on back-navigation
    const cached = readImageUrlCache(params.id);
    if (Object.keys(cached).length > 0) setImageUrls(cached);

    const fetchStyles = async () => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sessionRow } = await (supabase as any)
        .from("sessions")
        .select("face_shape, selected_styles, hair_attributes, created_at")
        .eq("id", params.id)
        .maybeSingle();

      if (sessionRow?.face_shape)      setFaceShape(sessionRow.face_shape);
      if (sessionRow?.selected_styles) setSelected(sessionRow.selected_styles);
      if (sessionRow?.hair_attributes) setHairAttrs(sessionRow.hair_attributes);
      if (sessionRow?.created_at)      setCreatedAt(sessionRow.created_at);

      // Count sessions up to and including this one to get the session number
      if (sessionRow?.created_at) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { count } = await (supabase as any)
            .from("sessions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .lte("created_at", sessionRow.created_at);
          if (count !== null) setSessionNumber(count);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("session_styles")
        .select("style_id, image_url, saved, shown_to_barber")
        .eq("session_id", params.id);

      const map: Record<string, string | null> = {};
      const savedMap: Record<string, boolean> = {};
      const barberMap: Record<string, boolean> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data) (data as any[]).forEach((row) => {
        map[row.style_id] = row.image_url;
        savedMap[row.style_id] = !!row.saved;
        barberMap[row.style_id] = !!row.shown_to_barber;
      });
      setImageUrls(map);
      writeImageUrlCache(params.id, map);
      setSavedStyles(savedMap);
      setBarberStyles(barberMap);

      // Show barber prompt if session is >24hrs old and nothing marked yet
      if (sessionRow?.created_at) {
        const elapsed = Date.now() - new Date(sessionRow.created_at).getTime();
        const dismissed = localStorage.getItem(`hs_barber_dismissed_${params.id}`);
        const hasMarks = Object.values(barberMap).some(Boolean);
        if (elapsed > 24 * 3600 * 1000 && !dismissed && !hasMarks) {
          setShowBarberPrompt(true);
        }
      }

      // Lazy-generate front view for all styles that haven't been generated yet
      const styleList: string[] = sessionRow?.selected_styles ?? Object.keys(map);
      const missing = styleList.filter(sid => !map[sid]);
      if (missing.length === 0) return;

      setTotalToGenerate(missing.length);
      setGeneratedCount(0);

      // Advertise in-flight set so the detail page can poll instead of duplicating
      inflightAdd(params.id, missing);

      // Batch of 4 per 60-second window to stay under the 5 images/min rate limit.
      // After each batch completes we wait out the remainder of the 62s window before firing the next.
      const BATCH = 4;
      const WINDOW = 62_000;
      let hitBilling = false;
      for (let i = 0; i < missing.length; i += BATCH) {
        if (hitBilling) break;
        const batchStart = Date.now();
        await Promise.allSettled(missing.slice(i, i + BATCH).map(async sid => {
          if (hitBilling) return;
          setGenerating(g => ({ ...g, [sid]: true }));
          try {
            const res = await fetch(`/api/sessions/${params.id}/styles/${sid}/generate-angle`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ angle: "front" }),
            });
            if (res.status === 402) { hitBilling = true; setBillingError(true); return; }
            const text = await res.text();
            const result = text ? JSON.parse(text) : {};
            if (res.ok && result.url) {
              setImageUrls(u => {
                const next = { ...u, [sid]: result.url };
                writeImageUrlCache(params.id, next);
                return next;
              });
            }
          } catch { /* silent — card stays empty */ }
          finally {
            inflightRemove(params.id, sid);
            setGenerating(g => ({ ...g, [sid]: false }));
            setGeneratedCount(c => c + 1);
          }
        }));
        if (i + BATCH < missing.length && !hitBilling) {
          const wait = Math.max(0, WINDOW - (Date.now() - batchStart));
          if (wait > 0) await new Promise(r => setTimeout(r, wait));
        }
      }
    };

    fetchStyles();
  }, [params.id]);

  useEffect(() => {
    const d = getReminderDate(params.id);
    if (d) setReminderDate(d);
  }, [params.id]);

  const handleSetReminder = () => {
    const due = saveReminder(params.id);
    if (due) { setReminderDate(due); setReminderJustSet(true); }
  };

  const toggleSave = async (e: React.MouseEvent, sid: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !savedStyles[sid];
    setSavedStyles(s => ({ ...s, [sid]: next }));
    try {
      await fetch(`/api/sessions/${params.id}/styles/${sid}/save`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: next }),
      });
    } catch {
      setSavedStyles(s => ({ ...s, [sid]: !next }));
    }
  };

  const toggleBarber = async (sid: string) => {
    const next = !barberStyles[sid];
    setBarberStyles(s => ({ ...s, [sid]: next }));
    if (next) {
      // Auto-dismiss prompt 1.5s after first mark — user has engaged
      setTimeout(() => setShowBarberPrompt(false), 1500);
    }
    try {
      await fetch(`/api/sessions/${params.id}/styles/${sid}/barber`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shown_to_barber: next }),
      });
    } catch {
      setBarberStyles(s => ({ ...s, [sid]: !next }));
    }
  };

  const dismissBarberPrompt = () => {
    localStorage.setItem(`hs_barber_dismissed_${params.id}`, "1");
    setShowBarberPrompt(false);
  };

  const displayStyleIds: string[] = selectedStyles ??
    Object.keys(imageUrls).filter(id => imageUrls[id]);

  const displayStyles = displayStyleIds
    .map(id => STYLES_MAP[id])
    .filter(Boolean);

  const attrChips = hairAttributes
    ? Object.entries(hairAttributes)
        .filter(([k]) => k !== "reasoning")
        .map(([k, v]) => ({ label: ATTR_LABELS[k] ?? k, value: v }))
    : [];

  const reasoning = hairAttributes?.reasoning ?? null;

  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", paddingBottom: 80 }}>
      <div style={{ height: 44 }} />

      <div style={{ maxWidth: 390, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ padding: "12px 18px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#9b94b8", fontSize: 13, fontWeight: 600 }}>
            <Link href="/profile" style={{ color: "#9b94b8", textDecoration: "none" }}>‹ Sessions</Link>
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#a78bfa" }}>
              {sessionNumber !== null ? `SESSION ${String(sessionNumber).padStart(2, "0")}` : "SESSION"}
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 27, letterSpacing: "-.02em", marginTop: 12 }}>
            {displayStyles.length > 0
              ? `${displayStyles.length} looks picked for you`
              : "Your looks"}
          </h1>

          {/* Face shape + attributes row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 8 }}>
            {faceShape && (
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, letterSpacing: ".05em", background: "rgba(124,58,237,.18)", color: "#a78bfa", padding: "3px 8px", borderRadius: 7, whiteSpace: "nowrap" }}>
                {faceShape.toUpperCase()} FACE
              </span>
            )}
            {attrChips.map(({ label, value }) => (
              <span key={label} style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, letterSpacing: ".04em", background: "#15121f", border: "1px solid #2a2540", color: "#9b94b8", padding: "3px 8px", borderRadius: 7, whiteSpace: "nowrap" }}>
                {label.toUpperCase()}: {value.toUpperCase()}
              </span>
            ))}
          </div>

          {reasoning
            ? <p style={{ fontSize: 11, color: "#6b6485", marginTop: 8, fontStyle: "italic", lineHeight: 1.5 }}>{reasoning}</p>
            : <p style={{ fontSize: 11, color: "#6b6485", marginTop: 4, fontStyle: "italic" }}>Style inspiration — results vary by hair type and barber skill.</p>
          }

          {/* Billing error banner */}
          {billingError && (
            <div style={{ marginTop: 12, borderRadius: 10, background: "#1a0e0e", border: "1px solid #7f1d1d", padding: "10px 12px" }}>
              <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#f87171", letterSpacing: ".04em", marginBottom: 4 }}>GENERATION PAUSED</div>
              <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>
                OpenAI billing limit reached — some looks couldn&apos;t be generated. Top up your OpenAI account to generate the remaining styles.
              </div>
            </div>
          )}

          {/* Generation progress banner */}
          {!billingError && totalToGenerate > 0 && generatedCount < totalToGenerate && (
            <div style={{ marginTop: 12, borderRadius: 10, background: "#15121f", border: "1px solid #2a2540", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: ".04em" }}>
                  GENERATING YOUR LOOKS
                </span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#6b6485" }}>
                  {generatedCount} / {totalToGenerate} ready
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "#2a2540", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", width: `${(generatedCount / totalToGenerate) * 100}%`, transition: "width 0.4s ease" }} />
              </div>
              <p style={{ fontSize: 10, color: "#4a4568", marginTop: 5 }}>
                {totalToGenerate - generatedCount > 4
                  ? "First 4 will appear shortly — the rest follow in ~1 min"
                  : "Almost there — finishing your remaining looks"}
              </p>
            </div>
          )}
        </div>

        {/* Style grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "4px 16px 16px" }}>
          {displayStyles.map((s) => {
            const imgUrl = imageUrls[s.id] ?? null;
            const isGen  = generatingStyles[s.id] ?? false;
            const suits  = faceShape ? (STYLE_FACE_FIT[s.id] ?? []).includes(faceShape) : false;
            const ready  = !!imgUrl;

            const cardStyle: React.CSSProperties = {
              position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "3/4",
              background: stripeBg(s.hue),
              boxShadow: suits ? "0 0 0 2px #7c3aed" : "inset 0 0 0 1px rgba(255,255,255,.06)",
              display: "block", textDecoration: "none",
              opacity: ready ? 1 : 0.6,
              cursor: ready ? "pointer" : "default",
            };

            const inner = (
              <>
                {imgUrl && (
                  <Image
                    src={imgUrl} alt={s.name} fill
                    sizes="(max-width: 600px) 45vw, 185px"
                    style={{ objectFit: "cover" }}
                    onError={ev => { (ev.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                {suits && ready && (
                  <div style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--font-space-mono)", fontSize: 8, letterSpacing: ".04em", background: "#7c3aed", color: "#fff", padding: "3px 7px", borderRadius: 7, zIndex: 2 }}>
                    ✓ SUITS YOU
                  </div>
                )}
                {ready && (
                  <button
                    onClick={e => toggleSave(e, s.id)}
                    style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(8,5,18,.5)", border: "none", color: savedStyles[s.id] ? "#fb7185" : "#cdbfff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
                  >{savedStyles[s.id] ? "♥" : "♡"}</button>
                )}

                {/* Generating spinner overlay */}
                {!imgUrl && isGen && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <style>{`@keyframes rSpin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #2a2540", borderTopColor: "#a78bfa", animation: "rSpin 0.9s linear infinite" }} />
                    <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#6b6485", letterSpacing: ".05em" }}>GENERATING</div>
                  </div>
                )}

                {/* Queued state — not yet started */}
                {!imgUrl && !isGen && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,.2)" }} />
                    </div>
                    <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "#4a4568", letterSpacing: ".05em" }}>QUEUED</div>
                  </div>
                )}

                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "28px 11px 11px", background: "linear-gradient(transparent,rgba(6,4,14,.94))", zIndex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: "-.01em", color: ready ? "#f4f2fb" : "#6b6485" }}>{s.name}</div>
                  <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: ready ? "#ab9fd0" : "#3a3358", letterSpacing: ".03em", marginTop: 2 }}>{s.tag}</div>
                </div>
              </>
            );

            return ready ? (
              <Link key={s.id} href={`/session/${params.id}/style/${s.id}`} style={cardStyle}>
                {inner}
              </Link>
            ) : (
              <div key={s.id} style={cardStyle}>
                {inner}
              </div>
            );
          })}
        </div>

        {/* Barber prompt — appears 24hrs after session, persists until dismissed or marked */}
        {showBarberPrompt && (
          <div style={{ margin: "0 16px 16px", borderRadius: 14, background: "#0d1a14", border: "1px solid #34d399", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#34d399", letterSpacing: ".06em" }}>✂ BARBER VISIT</span>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 3, color: "#f4f2fb" }}>Did you show any of these to your barber?</div>
              </div>
              <button onClick={dismissBarberPrompt} style={{ background: "none", border: "none", color: "#4a4568", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {displayStyles.slice(0, 9).map(s => {
                const marked = barberStyles[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleBarber(s.id)}
                    style={{
                      height: 30, borderRadius: 8, padding: "0 11px",
                      background: marked ? "rgba(52,211,153,.15)" : "#1a2420",
                      border: `1px solid ${marked ? "#34d399" : "#2a4038"}`,
                      color: marked ? "#34d399" : "#9b94b8",
                      fontWeight: 600, fontSize: 11, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
                    }}
                  >
                    {marked && <span style={{ fontSize: 9 }}>✓</span>}
                    {s.name}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: "#4a4568", marginTop: 8, lineHeight: 1.5 }}>
              Tap to mark · helps personalise your next session
            </div>
          </div>
        )}

        {/* Haircut reminder */}
        <div style={{ margin: "4px 16px 20px", borderRadius: 14, background: "#13101e", border: "1px solid #221e33", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✂</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Haircut reminder</div>
              <div style={{ fontSize: 12, color: "#9b94b8", marginTop: 2, lineHeight: 1.4 }}>
                {reminderDate
                  ? reminderJustSet
                    ? `Reminder set for ${formatDate(reminderDate)}`
                    : `Next cut due around ${formatDate(reminderDate)}`
                  : "Remind me when it's time for my next cut"}
              </div>
            </div>
            {!reminderDate && (
              <button
                onClick={handleSetReminder}
                style={{ height: 36, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: "0 14px", whiteSpace: "nowrap" }}
              >
                Set · 5 wks
              </button>
            )}
            {reminderDate && (
              <button
                onClick={() => { saveReminder(params.id); const d = getReminderDate(params.id); setReminderDate(d); setReminderJustSet(true); }}
                style={{ height: 36, borderRadius: 10, background: "transparent", border: "1px solid #2a2540", color: "#9b94b8", fontWeight: 600, fontSize: 11, cursor: "pointer", padding: "0 12px", whiteSpace: "nowrap" }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
    </AppShell>
  );
}
