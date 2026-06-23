"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { STYLES, stripeBg } from "@/lib/styles-data";
import { createClient } from "@/lib/supabase/client";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function ComparePage() {
  const { id, styleId } = useParams<{ id: string; styleId: string }>();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(58);
  const draggingRef = useRef(false);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);

  const styleIdx = STYLES.findIndex(s => s.id === styleId);
  const style = STYLES[styleIdx] ?? STYLES[0];
  const nextStyle = STYLES[(styleIdx + 1) % STYLES.length];
  const prevStyle = STYLES[(styleIdx - 1 + STYLES.length) % STYLES.length];

  // Fetch real images from Supabase
  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE || id === "demo") return;

    const fetchImages = async () => {
      const supabase = createClient();

      // Generated style image
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: styleRow } = await (supabase as any)
        .from("session_styles")
        .select("image_url")
        .eq("session_id", id)
        .eq("style_id", styleId)
        .single();

      if (styleRow?.image_url) setAfterUrl(styleRow.image_url);

      // Front photo (signed URL from uploads bucket)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: signed } = await supabase.storage
          .from("uploads")
          .createSignedUrl(`${user.id}/${id}/front.jpg`, 3600);
        if (signed?.signedUrl) setBeforeUrl(signed.signedUrl);
      }
    };

    fetchImages();
  }, [id, styleId]);

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
  const onPointerMove = (e: React.PointerEvent) => {
    if (draggingRef.current) moveTo(e.clientX);
  };
  const onPointerUp = () => { draggingRef.current = false; };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") router.push(`/session/${id}/style/${nextStyle.id}`);
      if (e.key === "ArrowLeft")  router.push(`/session/${id}/style/${prevStyle.id}`);
      if (e.key === "Escape")     router.push(`/session/${id}`);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [id, router, nextStyle.id, prevStyle.id]);

  return (
    <AppShell>
    <div style={{ height: "100dvh", background: "#0b0911", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column", maxWidth: 390, margin: "0 auto" }}>
      <div style={{ height: 44 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 18px 12px", flexShrink: 0, zIndex: 5 }}>
        <button onClick={() => router.push(`/session/${id}`)} style={{ color: "#cdc6e3", fontSize: 20, background: "none", border: "none", cursor: "pointer" }}>✕</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 16, letterSpacing: "-.01em" }}>{style.name}</div>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#a78bfa" }}>{styleIdx + 1} / {STYLES.length}</div>
        </div>
        <button style={{ color: "#cdc6e3", fontSize: 18, background: "none", border: "none", cursor: "pointer" }}>♡</button>
      </div>

      {/* Comparison area */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          position: "relative", flex: 1, overflow: "hidden",
          touchAction: "none", cursor: "ew-resize", userSelect: "none",
          background: "repeating-linear-gradient(135deg,#23222a,#23222a 10px,#2b2a33 10px,#2b2a33 20px)",
        }}
      >
        {/* Before layer (full width) */}
        <div style={{ position: "absolute", inset: 0 }}>
          {beforeUrl ? (
            <Image src={beforeUrl} alt="Before" fill style={{ objectFit: "cover" }} sizes="390px" />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 120, height: 120, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.18)" }} />
            </div>
          )}
        </div>
        <div style={{ position: "absolute", left: 12, bottom: 14, fontFamily: "var(--font-space-mono)", fontSize: 10, letterSpacing: ".06em", background: "rgba(0,0,0,.5)", padding: "5px 9px", borderRadius: 8, color: "#cfcfd6", zIndex: 1 }}>
          BEFORE · your photo
        </div>

        {/* After layer (clipped) */}
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, overflow: "hidden", width: `${pct}%` }}>
          <div style={{ width: 390, height: "100%", background: afterUrl ? "transparent" : stripeBg(style.hue), position: "relative" }}>
            {afterUrl && (
              <Image src={afterUrl} alt={style.name} fill style={{ objectFit: "cover" }} sizes="390px" />
            )}
            {!afterUrl && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.32)" }} />
              </div>
            )}
            <div style={{ position: "absolute", left: 12, bottom: 14, fontFamily: "var(--font-space-mono)", fontSize: 10, letterSpacing: ".06em", background: "rgba(124,58,237,.6)", padding: "5px 9px", borderRadius: 8, color: "#fff", zIndex: 2 }}>
              AFTER · {style.name}
            </div>
          </div>
        </div>

        {/* Divider + knob */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pct}%`, width: 2, background: "#fff", transform: "translateX(-1px)", boxShadow: "0 0 12px rgba(255,255,255,.5)", zIndex: 3 }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "#fff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 14px rgba(0,0,0,.4)" }}>
            ⟺
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: "16px 18px 22px", display: "flex", flexDirection: "column", gap: 11, flexShrink: 0, zIndex: 5 }}>
        <div style={{ display: "flex", gap: 11 }}>
          <button style={{ flex: 1, height: 50, borderRadius: 13, background: "#181527", border: "1px solid #2a2540", fontWeight: 700, fontSize: 14, color: "#cdc6e3", cursor: "pointer" }}>
            ↗ Share
          </button>
          <button style={{ flex: 1.4, height: 50, borderRadius: 13, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", fontWeight: 700, fontSize: 14, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}>
            ♡ Save look
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {STYLES.map((s, i) => (
            <div
              key={s.id}
              onClick={() => router.push(`/session/${id}/style/${s.id}`)}
              style={{ width: i === styleIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === styleIdx ? "#a78bfa" : "#3a3358", cursor: "pointer", transition: "all .2s" }}
            />
          ))}
        </div>
      </div>

    </div>
    </AppShell>
  );
}
