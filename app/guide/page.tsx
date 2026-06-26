"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

const stripePanel = "repeating-linear-gradient(135deg,#211d33,#211d33 8px,#272138 8px,#272138 16px)";

export default function GuidePage() {
  const router = useRouter();

  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 44, flexShrink: 0 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 22px 24px", maxWidth: 390, width: "100%", margin: "0 auto", overflow: "hidden" }}>

        <button onClick={() => router.back()} style={{ color: "#9b94b8", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>‹ Back</button>

        <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", lineHeight: 1.05, marginTop: 16 }}>
          3 photos.<br />Good light.<br />That&apos;s it.
        </h1>
        <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 10 }}>
          Better photos = better previews. Here&apos;s the angle for each.
        </p>

        {/* 3 panels */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 20 }}>
          {([
            {
              label: "FRONT", hint: "Face camera",
              svg: (
                <svg viewBox="0 0 60 80" width="60" height="80">
                  <ellipse cx="30" cy="30" rx="14" ry="18" fill="#2a2445" />
                  <rect x="24" y="47" width="12" height="8" rx="4" fill="#2a2445" />
                  <path d="M10 72 Q30 62 50 72" fill="none" stroke="#2a2445" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="30" cy="32" r="2" fill="#7c3aed" opacity="0.7" />
                  <line x1="30" y1="14" x2="30" y2="46" stroke="#3a3060" strokeWidth="0.8" />
                </svg>
              ),
            },
            {
              label: "LEFT", hint: "Turn head left",
              svg: (
                <svg viewBox="0 0 60 80" width="60" height="80">
                  <ellipse cx="34" cy="30" rx="12" ry="17" fill="#2a2445" />
                  <rect x="28" y="46" width="10" height="7" rx="3" fill="#2a2445" />
                  <path d="M14 72 Q32 63 50 72" fill="none" stroke="#2a2445" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M22 25 Q16 30 20 36" fill="none" stroke="#4a3a70" strokeWidth="2" strokeLinecap="round" />
                  <path d="M26 18 L22 14" stroke="#5a4b80" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              label: "RIGHT", hint: "Turn head right",
              svg: (
                <svg viewBox="0 0 60 80" width="60" height="80">
                  <ellipse cx="26" cy="30" rx="12" ry="17" fill="#2a2445" />
                  <rect x="22" y="46" width="10" height="7" rx="3" fill="#2a2445" />
                  <path d="M10 72 Q28 63 46 72" fill="none" stroke="#2a2445" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M38 25 Q44 30 40 36" fill="none" stroke="#4a3a70" strokeWidth="2" strokeLinecap="round" />
                  <path d="M34 18 L38 14" stroke="#5a4b80" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              ),
            },
          ] as const).map(({ label, hint, svg }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ aspectRatio: "3/4", borderRadius: 13, background: stripePanel, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #2a2540", gap: 4, padding: "10px 6px" }}>
                {svg}
              </div>
              <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", marginTop: 7 }}>{label}</div>
              <div style={{ fontSize: 10, color: "#6b6485", marginTop: 2, lineHeight: 1.3 }}>{hint}</div>
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 11 }}>
          {["Good, even lighting", "No glasses or hats", "Neutral expression", "Hair out of your face"].map(tip => (
            <div key={tip} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(5,150,105,.16)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✓</span>
              {tip}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/upload" style={{ marginTop: "auto", height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "none", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}>
          Got it — let&apos;s go
        </Link>

      </div>
    </div>
    </AppShell>
  );
}
