"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";
import { STYLES, stripeBg } from "@/lib/styles-data";
import { createClient } from "@/lib/supabase/client";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE || params.id === "demo") return;

    const fetchStyles = async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("session_styles")
        .select("style_id, image_url")
        .eq("session_id", params.id);

      if (data) {
        const map: Record<string, string | null> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any[]).forEach((row) => { map[row.style_id] = row.image_url; });
        setImageUrls(map);
      }
    };

    fetchStyles();
  }, [params.id]);

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
            10 looks, just for you
          </h1>
          <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 4 }}>Tap any look to compare with your photo.</p>
          <p style={{ fontSize: 11, color: "#6b6485", marginTop: 6, fontStyle: "italic" }}>Style inspiration — results vary by hair type and barber skill.</p>
        </div>

        {/* 2-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "4px 16px 16px" }}>
          {STYLES.map((s, idx) => {
            const imgUrl = imageUrls[s.id] ?? null;
            return (
              <Link
                key={s.id}
                href={`/session/${params.id}/style/${s.id}`}
                style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "3/4", background: stripeBg(s.hue), boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)", display: "block", textDecoration: "none" }}
              >
                {/* Real generated image */}
                {imgUrl && (
                  <Image
                    src={imgUrl}
                    alt={s.name}
                    fill
                    sizes="(max-width: 600px) 45vw, 185px"
                    style={{ objectFit: "cover" }}
                  />
                )}

                {/* AI badge */}
                <div style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--font-space-mono)", fontSize: 9, letterSpacing: ".05em", background: "rgba(8,5,18,.5)", color: "#cdbfff", padding: "3px 7px", borderRadius: 7, zIndex: 1 }}>AI</div>

                {/* Save button */}
                <button
                  onClick={e => e.preventDefault()}
                  style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(8,5,18,.5)", border: "none", color: "#cdbfff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
                >♡</button>

                {/* Face circle placeholder (shown when no image) */}
                {!imgUrl && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.22)" }} />
                  </div>
                )}

                {/* Name scrim */}
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "28px 11px 11px", background: "linear-gradient(transparent,rgba(6,4,14,.94))", zIndex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: "-.01em", color: "#f4f2fb" }}>{s.name}</div>
                  <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#ab9fd0", letterSpacing: ".03em", marginTop: 2 }}>{s.tag}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
    </AppShell>
  );
}
