import Link from "next/link";
import AppShell from "@/components/AppShell";

const stripePanel = "repeating-linear-gradient(135deg,#211d33,#211d33 8px,#272138 8px,#272138 16px)";

export default function GuidePage() {
  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 44, flexShrink: 0 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 22px 24px", maxWidth: 390, width: "100%", margin: "0 auto", overflow: "hidden" }}>

        <Link href="/login" style={{ color: "#9b94b8", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>‹ Back</Link>

        <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", lineHeight: 1.05, marginTop: 16 }}>
          3 photos.<br />Good light.<br />That&apos;s it.
        </h1>
        <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 10 }}>
          Better photos = better previews. Here&apos;s the angle for each.
        </p>

        {/* 3 panels */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 20 }}>
          {[
            { label: "FRONT",  offset: 0 },
            { label: "LEFT",   offset: -6 },
            { label: "RIGHT",  offset: 6 },
          ].map(({ label, offset }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ aspectRatio: "3/4", borderRadius: 13, background: stripePanel, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #2a2540" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.3)", transform: `translateX(${offset}px)` }} />
              </div>
              <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", marginTop: 7 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
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
