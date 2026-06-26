"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { STYLES, STYLES_MAP, stripeBg } from "@/lib/styles-data";
import { createClient } from "@/lib/supabase/client";

function UpgradeModal({ feature, onClose }: { feature: string; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#15121f", borderRadius: "20px 20px 0 0", padding: "8px 24px 40px", border: "1px solid #2a2540", borderBottom: "none" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#3a3358", margin: "12px auto 22px" }} />
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 12px 26px -10px rgba(124,58,237,.7)" }}>✨</div>
        <h2 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 22, textAlign: "center", letterSpacing: "-.02em", margin: 0 }}>
          {feature}
        </h2>
        <p style={{ fontSize: 14, color: "#9b94b8", textAlign: "center", marginTop: 10, lineHeight: 1.55, maxWidth: 280, margin: "10px auto 0" }}>
          Buy a session pack to unlock this feature. Credits never expire.
        </p>
        <Link
          href="/upgrade"
          style={{ marginTop: 22, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "none", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}
        >
          Buy sessions — from NPR 199
        </Link>
        <button
          onClick={onClose}
          style={{ marginTop: 10, width: "100%", height: 46, borderRadius: 13, background: "transparent", border: "1px solid #2a2540", color: "#9b94b8", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

// Check if results page is already generating this style
function isInflight(sessionId: string, styleId: string): boolean {
  try {
    const arr: string[] = JSON.parse(sessionStorage.getItem(`hs_inflight_${sessionId}`) ?? "[]");
    return arr.includes(styleId);
  } catch { return false; }
}

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Angle = "front" | "left" | "right";

const ANGLE_LABELS: Record<Angle, string> = {
  front: "Front",
  left:  "Left",
  right: "Right",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function ComparePage() {
  const { id, styleId } = useParams<{ id: string; styleId: string }>();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(58);
  const draggingRef = useRef(false);
  const [showBarber, setShowBarber] = useState(false);
  // Natural aspect ratio of the before (uploaded) photo — used to size the comparison area
  const [beforeRatio, setBeforeRatio] = useState<number | null>(null);
  const [activeAngle, setActiveAngle] = useState<Angle>("front");
  const [loading, setLoading] = useState(true);
  const [sessionStyleIds, setSessionStyleIds] = useState<string[]>([]);

  const [beforeUrls, setBeforeUrls] = useState<Record<Angle, string | null>>({ front: null, left: null, right: null });
  const [afterUrls, setAfterUrls]   = useState<Record<Angle, string | null>>({ front: null, left: null, right: null });
  const [generating, setGenerating] = useState<Record<Angle, boolean>>({ front: false, left: false, right: false });
  const [isSaved, setIsSaved]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing]         = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isPaid, setIsPaid]           = useState(SANDBOX); // unlocked in sandbox, locked until confirmed in prod
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);
  const swipeTouchStart = useRef<{ x: number; y: number; onSlider: boolean } | null>(null);

  // Navigation uses the session's personalised style list; fall back to full catalog
  const navStyles = sessionStyleIds.length > 0
    ? sessionStyleIds.map(sid => STYLES_MAP[sid]).filter(Boolean)
    : [...STYLES];
  const styleIdx  = navStyles.findIndex(s => s.id === styleId);
  const style     = navStyles[styleIdx] ?? STYLES_MAP[styleId] ?? STYLES[0];
  const nextStyle = navStyles[(styleIdx + 1) % navStyles.length] ?? style;
  const prevStyle = navStyles[(styleIdx - 1 + navStyles.length) % navStyles.length] ?? style;

  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE || id === "demo") {
      setLoading(false);
      return;
    }

    const load = async () => {
      const supabase = createClient();

      // Fetch session's selected styles for navigation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sessionRow } = await (supabase as any)
        .from("sessions")
        .select("selected_styles")
        .eq("id", id)
        .maybeSingle();
      if (sessionRow?.selected_styles?.length) {
        setSessionStyleIds(sessionRow.selected_styles);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: styleRow } = await (supabase as any)
        .from("session_styles")
        .select("*")
        .eq("session_id", id)
        .eq("style_id", styleId)
        .maybeSingle();

      const afterFront = styleRow?.image_url       ?? null;
      const afterLeft  = styleRow?.image_url_left  ?? null;
      const afterRight = styleRow?.image_url_right ?? null;

      setAfterUrls({ front: afterFront, left: afterLeft, right: afterRight });
      if (styleRow?.saved) setIsSaved(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Gate paid features: user is "paid" if they have ever bought credits
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cr } = await (supabase as any)
        .from("credits")
        .select("sessions_remaining")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsPaid(cr !== null); // any credits row = has purchased at least once

      const angles: Angle[] = ["front", "left", "right"];
      const signed = await Promise.all(
        angles.map(a =>
          supabase.storage.from("uploads").createSignedUrl(`${user.id}/${id}/${a}.jpg`, 60 * 60 * 24 * 365)
        )
      );
      setBeforeUrls({
        front: signed[0].data?.signedUrl ?? null,
        left:  signed[1].data?.signedUrl ?? null,
        right: signed[2].data?.signedUrl ?? null,
      });

      setLoading(false);
    };

    load();
  }, [id, styleId]);

  // After load: if no front image, poll DB first (catches results-page background generation).
  // Only fire a fresh generation request after 3 empty polls (9 s) with nothing in-flight.
  useEffect(() => {
    if (loading || afterUrls.front || generating.front || autoTriggeredRef.current) return;
    if (SANDBOX || !HAS_SUPABASE || id === "demo") return;
    autoTriggeredRef.current = true;
    setGenerating(g => ({ ...g, front: true }));

    const supabase = createClient();
    let polls = 0;
    let generated = false;

    const timer = setInterval(async () => {
      polls++;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("session_styles")
          .select("image_url")
          .eq("session_id", id)
          .eq("style_id", styleId)
          .maybeSingle();

        if (data?.image_url) {
          setAfterUrls(u => ({ ...u, front: data.image_url }));
          setGenerating(g => ({ ...g, front: false }));
          clearInterval(timer);
          return;
        }

        // After 1 poll (3 s), if nothing is in-flight, generate here
        if (polls >= 1 && !isInflight(id, styleId) && !generated) {
          generated = true;
          fetch(`/api/sessions/${id}/styles/${styleId}/generate-angle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ angle: "front" }),
          })
            .then(r => r.text())
            .then(t => { const d = t ? JSON.parse(t) : {}; if (d.url) setAfterUrls(u => ({ ...u, front: d.url })); })
            .catch(() => {})
            .finally(() => {
              setGenerating(g => ({ ...g, front: false }));
              clearInterval(timer);
            });
          return;
        }

        // 2-minute hard timeout — show retry
        if (polls >= 40) {
          setGenerating(g => ({ ...g, front: false }));
          clearInterval(timer);
        }
      } catch {
        setGenerating(g => ({ ...g, front: false }));
        clearInterval(timer);
      }
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, afterUrls.front]);

  // Only generate a side angle when the user explicitly taps its tab
  const generateAngle = useCallback(async (angle: "left" | "right") => {
    if (afterUrls[angle] || generating[angle] || SANDBOX || !HAS_SUPABASE || id === "demo") return;
    setGenerating(g => ({ ...g, [angle]: true }));
    try {
      const res = await fetch(`/api/sessions/${id}/styles/${styleId}/generate-angle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angle }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok && data.url) setAfterUrls(u => ({ ...u, [angle]: data.url }));
    } finally {
      setGenerating(g => ({ ...g, [angle]: false }));
    }
  }, [afterUrls, generating, id, styleId]);

  const handleShare = useCallback(async () => {
    const url = afterUrls[activeAngle];
    if (!url || sharing) return;
    setSharing(true);
    try {
      const sharePayload = {
        title: `${style.name} · Banlah`,
        text: `Check out this hairstyle I'm thinking of getting — ${style.name}`,
        url: window.location.href,
      };

      if (typeof navigator.share === "function") {
        // Try sharing the actual image file first (works on mobile)
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const file = new File([blob], `${style.name.replace(/\s+/g, "_")}.jpg`, { type: "image/jpeg" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: sharePayload.title, text: sharePayload.text });
            return;
          }
        } catch { /* fall through to URL share */ }
        await navigator.share(sharePayload);
        return;
      }

      // Desktop fallback: copy link to clipboard
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        await navigator.clipboard.writeText(window.location.href).catch(() => {});
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2200);
      }
    } finally {
      setSharing(false);
    }
  }, [afterUrls, activeAngle, sharing, style.name]);

  const handleAngleChange = useCallback((angle: Angle) => {
    setActiveAngle(angle);
    if (angle === "left" || angle === "right") generateAngle(angle);
  }, [generateAngle]);

  const moveTo = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPct(clamp(((clientX - r.left) / r.width) * 100, 4, 96));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => { if (draggingRef.current) moveTo(e.clientX); };
  const onPointerUp   = () => { draggingRef.current = false; };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showBarber) { setShowBarber(false); return; }
      if (e.key === "ArrowRight") router.push(`/session/${id}/style/${nextStyle.id}`);
      if (e.key === "ArrowLeft")  router.push(`/session/${id}/style/${prevStyle.id}`);
      if (e.key === "Escape")     router.back();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [id, router, nextStyle.id, prevStyle.id, showBarber]);

  const beforeUrl    = beforeUrls[activeAngle];
  const afterUrl     = afterUrls[activeAngle];
  const isGenerating = generating[activeAngle];

  // ── Show Barber overlay ───────────────────────────────────────────────────
  if (showBarber) {
    return (
      <AppShell>
      <div
        onClick={() => setShowBarber(false)}
        style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000", display: "flex", flexDirection: "column", cursor: "pointer" }}
      >
        <div style={{ position: "relative", width: "100%", flex: 1, overflow: "hidden" }}>
          {afterUrl
            ? <Image src={afterUrl} alt={style.name} fill style={{ objectFit: "cover", objectPosition: "center top" }} sizes="390px" />
            : (
              <div style={{ position: "absolute", inset: 0, background: stripeBg(style.hue), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 160, height: 160, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)" }} />
              </div>
            )
          }
        </div>
        <div style={{ padding: "18px 24px 40px", textAlign: "center", width: "100%", background: "rgba(0,0,0,.85)" }}>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 22, color: "#f4f2fb", letterSpacing: "-.02em" }}>{style.name}</div>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: ".08em", marginTop: 4 }}>{style.tag} · {ANGLE_LABELS[activeAngle].toUpperCase()} VIEW</div>
          <div style={{ fontSize: 13, color: "#9b94b8", marginTop: 14, fontWeight: 500 }}>Tap anywhere to close</div>
        </div>
      </div>
      </AppShell>
    );
  }

  // ── Main comparison view ──────────────────────────────────────────────────
  const renderContent = () => {
    // Still fetching from DB
    if (loading) {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "#0b0911" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #2a2540", borderTopColor: "#7c3aed", animation: "spin 0.9s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // Generating this angle's image
    if (isGenerating) {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "#0b0911" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #2a2540", borderTopColor: "#7c3aed", animation: "spin 0.9s linear infinite" }} />
          <div style={{ fontSize: 13, color: "#6b6485" }}>Generating {ANGLE_LABELS[activeAngle].toLowerCase()} view…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // No generated image for this style — offer retry
    if (!afterUrl) {
      const retry = async () => {
        setGenerating(g => ({ ...g, [activeAngle]: true }));
        try {
          const res = await fetch(`/api/sessions/${id}/styles/${styleId}/generate-angle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ angle: activeAngle }),
          });
          const text = await res.text();
          const data = text ? JSON.parse(text) : {};
          if (res.ok && data.url) setAfterUrls(u => ({ ...u, [activeAngle]: data.url }));
        } finally {
          setGenerating(g => ({ ...g, [activeAngle]: false }));
        }
      };
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#0b0911", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>✂</div>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 18, color: "#cdc6e3" }}>Generation failed</div>
          <div style={{ fontSize: 13, color: "#6b6485", maxWidth: 240, lineHeight: 1.5 }}>Something went wrong rendering this look. Tap retry to try again.</div>
          <button
            onClick={retry}
            style={{ marginTop: 8, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "0 28px", boxShadow: "0 8px 20px -8px rgba(124,58,237,.8)" }}
          >
            Retry generation
          </button>
        </div>
      );
    }

    // Generated image exists but no original photo for comparison — show full-screen
    if (!beforeUrl) {
      return (
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#111" }}>
          <Image src={afterUrl} alt={style.name} fill style={{ objectFit: "cover", objectPosition: "center top" }} sizes="390px" />
          <div style={{ position: "absolute", left: 12, bottom: 14, fontFamily: "var(--font-space-mono)", fontSize: 10, letterSpacing: ".06em", background: "rgba(124,58,237,.7)", padding: "5px 9px", borderRadius: 8, color: "#fff", zIndex: 2, whiteSpace: "nowrap" }}>
            {style.name} · {ANGLE_LABELS[activeAngle].toUpperCase()}
          </div>
        </div>
      );
    }

    // Full before/after comparison slider
    // We lock the comparison container to the before image's aspect ratio so both images
    // cover exactly the same frame. The generated image (always 1:1) uses "cover" within
    // that frame and objectPosition "center top" so faces land at the same vertical position.
    const containerStyle: React.CSSProperties = beforeRatio
      ? { position: "relative", width: "100%", aspectRatio: String(beforeRatio), overflow: "hidden", touchAction: "none", cursor: "ew-resize", userSelect: "none", background: "#111", flexShrink: 0 }
      : { position: "relative", flex: 1, overflow: "hidden", touchAction: "none", cursor: "ew-resize", userSelect: "none", background: "#111" };

    return (
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={containerStyle}
      >
        {/* Before layer (full width, underneath) — captures natural ratio on first load */}
        <div style={{ position: "absolute", inset: 0 }}>
          <Image
            src={beforeUrl} alt="Before" fill
            onLoad={e => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.naturalWidth && img.naturalHeight && !beforeRatio) {
                setBeforeRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
            style={{ objectFit: "cover", objectPosition: "center top" }} sizes="390px"
          />
        </div>
        <div style={{ position: "absolute", right: 12, bottom: 14, fontFamily: "var(--font-space-mono)", fontSize: 10, letterSpacing: ".06em", background: "rgba(0,0,0,.6)", padding: "5px 9px", borderRadius: 8, color: "#cfcfd6", zIndex: 1 }}>
          BEFORE
        </div>

        {/* After layer (clipped from left to divider) */}
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, overflow: "hidden", width: `${pct}%` }}>
          <div style={{ position: "absolute", inset: 0, width: 390 }}>
            <Image src={afterUrl} alt={style.name} fill style={{ objectFit: "cover", objectPosition: "center top" }} sizes="390px" />
            <div style={{ position: "absolute", left: 12, bottom: 14, fontFamily: "var(--font-space-mono)", fontSize: 10, letterSpacing: ".06em", background: "rgba(124,58,237,.7)", padding: "5px 9px", borderRadius: 8, color: "#fff", zIndex: 2, whiteSpace: "nowrap" }}>
              AFTER · {style.name}
            </div>
          </div>
        </div>

        {/* Divider + drag knob */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pct}%`, width: 2, background: "#fff", transform: "translateX(-1px)", boxShadow: "0 0 12px rgba(255,255,255,.5)", zIndex: 3 }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "#fff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 14px rgba(0,0,0,.4)" }}>
            ⟺
          </div>
        </div>
      </div>
    );
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const onSlider = containerRef.current?.contains(e.target as Node) ?? false;
    swipeTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, onSlider };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!swipeTouchStart.current) return;
    const { x: startX, y: startY, onSlider } = swipeTouchStart.current;
    swipeTouchStart.current = null;
    if (onSlider) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) router.push(`/session/${id}/style/${nextStyle.id}`);
    else router.push(`/session/${id}/style/${prevStyle.id}`);
  };

  return (
    <AppShell>
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ height: "100dvh", background: "#0b0911", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column", maxWidth: 390, margin: "0 auto" }}
    >
      <div style={{ height: 44 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 18px 10px", flexShrink: 0 }}>
        <button onClick={() => router.back()} aria-label="Close" style={{ color: "#cdc6e3", fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: 8 }}>✕</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 16, letterSpacing: "-.01em" }}>{style.name}</div>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#a78bfa" }}>{styleIdx + 1} / {navStyles.length}</div>
        </div>
        {/* Spacer to balance header */}
        <div style={{ width: 36 }} />
      </div>

      {/* Angle tabs */}
      <div style={{ display: "flex", gap: 6, padding: "0 18px 10px", flexShrink: 0 }}>
        {(["front", "left", "right"] as Angle[]).map(angle => {
          const active  = activeAngle === angle;
          const done    = !!afterUrls[angle];
          const pending = generating[angle];
          return (
            <button
              key={angle}
              onClick={() => {
                if (angle !== "front" && !isPaid) {
                  setUpgradePrompt("Side angles are a Standard feature");
                  return;
                }
                handleAngleChange(angle);
              }}
              style={{
                flex: 1, height: 32, borderRadius: 10, border: "none", cursor: "pointer",
                background: active ? "linear-gradient(135deg,#8b5cf6,#7c3aed)" : "#15121f",
                color: active ? "#fff" : (angle !== "front" && !isPaid) ? "#3a3358" : "#6b6485",
                fontFamily: "var(--font-space-mono)", fontSize: 9, letterSpacing: ".06em",
                fontWeight: 700, transition: "all .15s",
                outline: active ? "none" : "1px solid #2a2540",
                position: "relative",
              }}
            >
              {ANGLE_LABELS[angle].toUpperCase()}
              {angle !== "front" && !isPaid && (
                <span style={{ position: "absolute", top: 4, right: 5, background: "#2a2045", border: "1px solid #3a3358", borderRadius: 4, fontSize: 8, color: "#9b94b8", padding: "1px 4px", lineHeight: "12px", letterSpacing: ".02em" }}>PRO</span>
              )}
              {angle !== "front" && isPaid && (
                <span style={{
                  position: "absolute", top: 5, right: 6,
                  width: 5, height: 5, borderRadius: "50%",
                  background: pending ? "#f59e0b" : done ? "#34d399" : "#3a3358",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      {renderContent()}

      {/* Bottom actions */}
      <div style={{ padding: "14px 18px 22px", display: "flex", flexDirection: "column", gap: 11, flexShrink: 0 }}>
        {/* "Link copied" toast */}
        {shareCopied && (
          <div style={{ position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)", background: "#1e1a30", border: "1px solid #3a3358", borderRadius: 10, padding: "9px 18px", fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#a78bfa", whiteSpace: "nowrap", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
            Link copied to clipboard ✓
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { if (afterUrl) setShowBarber(true); }}
            disabled={!afterUrl}
            style={{ flex: 1, height: 50, borderRadius: 13, background: "#181527", border: "1px solid #2a2540", fontWeight: 700, fontSize: 12, color: afterUrl ? "#cdc6e3" : "#3a3358", cursor: afterUrl ? "pointer" : "default", position: "relative" }}
          >
            ✂ Show Barber
          </button>
          <button
            onClick={handleShare}
            disabled={!afterUrl || sharing}
            style={{ width: 50, height: 50, borderRadius: 13, background: "#181527", border: "1px solid #2a2540", fontWeight: 700, fontSize: 17, color: afterUrl ? "#cdc6e3" : "#3a3358", cursor: afterUrl ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Share"
          >
            {sharing ? "…" : "↗"}
          </button>
          <button
            onClick={async () => {
              if (!isPaid) { setUpgradePrompt("Download is a Standard feature"); return; }
              if (!afterUrl) return;
              setDownloading(true);
              try {
                const res = await fetch(afterUrl);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${style.name.replace(/\s+/g, "_")}.jpg`; a.click();
                URL.revokeObjectURL(url);
              } finally { setDownloading(false); }
            }}
            disabled={!afterUrl || downloading}
            style={{ width: 50, height: 50, borderRadius: 13, background: "#181527", border: "1px solid #2a2540", fontWeight: 700, fontSize: isPaid ? 16 : 12, color: afterUrl ? (isPaid ? "#cdc6e3" : "#6b6485") : "#3a3358", cursor: afterUrl ? "pointer" : "default", flexShrink: 0 }}
            title="Download"
          >
            {downloading ? "…" : isPaid ? "↓" : "🔒"}
          </button>
          <button
            onClick={async () => {
              if (SANDBOX || !HAS_SUPABASE) return;
              const next = !isSaved;
              setIsSaved(next);
              await fetch(`/api/sessions/${id}/styles/${styleId}/save`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ saved: next }),
              });
            }}
            style={{ flex: 1, height: 50, borderRadius: 13, background: isSaved ? "linear-gradient(135deg,#8b5cf6,#7c3aed)" : "#181527", border: isSaved ? "none" : "1px solid #2a2540", fontWeight: 700, fontSize: 14, color: isSaved ? "#fff" : "#cdc6e3", cursor: "pointer", boxShadow: isSaved ? "0 12px 26px -10px rgba(124,58,237,.8)" : "none", transition: "all .2s" }}
          >
            {isSaved ? "♥ Saved" : "♡ Save"}
          </button>
        </div>

        {/* Progress dots — padded for minimum 44px touch target */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {navStyles.map((s, i) => (
            <button
              key={s.id}
              onClick={() => router.push(`/session/${id}/style/${s.id}`)}
              aria-label={`Style ${i + 1}: ${s.name}`}
              style={{ padding: "12px 5px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <div style={{ width: i === styleIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === styleIdx ? "#a78bfa" : "#3a3358", transition: "all .2s" }} />
            </button>
          ))}
        </div>
      </div>

    </div>

    {upgradePrompt && (
      <UpgradeModal feature={upgradePrompt} onClose={() => setUpgradePrompt(null)} />
    )}
    </AppShell>
  );
}
