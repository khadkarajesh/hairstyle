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
  const [imageUrls, setImageUrls]           = useState<Record<string, string | null>>({});
  const [faceShape, setFaceShape]           = useState<string | null>(null);
  const [selectedStyles, setSelected]       = useState<string[] | null>(null);
  const [hairAttributes, setHairAttrs]      = useState<Record<string, string> | null>(null);
  const [generatingStyles, setGenerating]   = useState<Record<string, boolean>>({});
  const [savedStyles, setSavedStyles]       = useState<Record<string, boolean>>({});
  const [reminderDate, setReminderDate]     = useState<Date | null>(null);
  const [reminderJustSet, setReminderJustSet] = useState(false);

  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE || params.id === "demo") return;

    const fetchStyles = async () => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sessionRow } = await (supabase as any)
        .from("sessions")
        .select("face_shape, selected_styles, hair_attributes")
        .eq("id", params.id)
        .single();

      if (sessionRow?.face_shape)      setFaceShape(sessionRow.face_shape);
      if (sessionRow?.selected_styles) setSelected(sessionRow.selected_styles);
      if (sessionRow?.hair_attributes) setHairAttrs(sessionRow.hair_attributes);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("session_styles")
        .select("style_id, image_url, saved")
        .eq("session_id", params.id);

      const map: Record<string, string | null> = {};
      const savedMap: Record<string, boolean> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data) (data as any[]).forEach((row) => {
        map[row.style_id] = row.image_url;
        savedMap[row.style_id] = !!row.saved;
      });
      setImageUrls(map);
      setSavedStyles(savedMap);

      // Lazy-generate front view for all styles that haven't been generated yet
      const styleList: string[] = sessionRow?.selected_styles ?? Object.keys(map);
      const missing = styleList.filter(sid => !map[sid]);
      if (missing.length === 0) return;

      // Advertise in-flight set so the detail page can poll instead of duplicating
      inflightAdd(params.id, missing);

      const generateOne = async (sid: string) => {
        setGenerating(g => ({ ...g, [sid]: true }));
        try {
          const res = await fetch(`/api/sessions/${params.id}/styles/${sid}/generate-angle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ angle: "front" }),
          });
          const text = await res.text();
          const result = text ? JSON.parse(text) : {};
          if (res.ok && result.url) {
            setImageUrls(u => ({ ...u, [sid]: result.url }));
          }
        } catch { /* silent — card stays empty, user can retry from detail view */ }
        finally {
          inflightRemove(params.id, sid);
          setGenerating(g => ({ ...g, [sid]: false }));
        }
      };

      // Batch of 4 per 60-second window to stay under the 5 images/min rate limit.
      // After each batch completes we wait out the remainder of the 62s window before firing the next.
      const BATCH = 4;
      const WINDOW = 62_000;
      for (let i = 0; i < missing.length; i += BATCH) {
        const batchStart = Date.now();
        await Promise.allSettled(missing.slice(i, i + BATCH).map(generateOne));
        if (i + BATCH < missing.length) {
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
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#a78bfa" }}>SESSION 01</span>
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
        </div>

        {/* Style grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "4px 16px 16px" }}>
          {displayStyles.map((s) => {
            const imgUrl     = imageUrls[s.id] ?? null;
            const isGen      = generatingStyles[s.id] ?? false;
            const suits      = faceShape ? (STYLE_FACE_FIT[s.id] ?? []).includes(faceShape) : false;
            return (
              <Link
                key={s.id}
                href={`/session/${params.id}/style/${s.id}`}
                style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "3/4", background: stripeBg(s.hue), boxShadow: suits ? "0 0 0 2px #7c3aed" : "inset 0 0 0 1px rgba(255,255,255,.06)", display: "block", textDecoration: "none" }}
              >
                {imgUrl && (
                  <Image
                    src={imgUrl}
                    alt={s.name}
                    fill
                    sizes="(max-width: 600px) 45vw, 185px"
                    style={{ objectFit: "cover" }}
                    onError={ev => { (ev.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                {suits && (
                  <div style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--font-space-mono)", fontSize: 8, letterSpacing: ".04em", background: "#7c3aed", color: "#fff", padding: "3px 7px", borderRadius: 7, zIndex: 2 }}>
                    ✓ SUITS YOU
                  </div>
                )}
                <button
                  onClick={e => toggleSave(e, s.id)}
                  style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(8,5,18,.5)", border: "none", color: savedStyles[s.id] ? "#fb7185" : "#cdbfff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
                >{savedStyles[s.id] ? "♥" : "♡"}</button>

                {/* Generating spinner overlay */}
                {!imgUrl && isGen && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <style>{`@keyframes rSpin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #2a2540", borderTopColor: "#a78bfa", animation: "rSpin 0.9s linear infinite" }} />
                    <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#6b6485", letterSpacing: ".05em" }}>GENERATING</div>
                  </div>
                )}

                {/* Placeholder circle when not yet generated and not generating */}
                {!imgUrl && !isGen && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.22)" }} />
                  </div>
                )}

                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "28px 11px 11px", background: "linear-gradient(transparent,rgba(6,4,14,.94))", zIndex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: "-.01em", color: "#f4f2fb" }}>{s.name}</div>
                  <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#ab9fd0", letterSpacing: ".03em", marginTop: 2 }}>{s.tag}</div>
                </div>
              </Link>
            );
          })}
        </div>

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
