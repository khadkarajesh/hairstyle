import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function UpgradePage() {
  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "radial-gradient(120% 70% at 50% 0%, #1b1230 0%, #0f0d17 55%)", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 44 }} />

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", padding: "14px 22px 22px", maxWidth: 390, width: "100%", margin: "0 auto" }}>

        {/* Close */}
        <div style={{ textAlign: "right", color: "#9b94b8", fontSize: 20 }}>
          <Link href="/session/demo" style={{ color: "#9b94b8", textDecoration: "none" }}>✕</Link>
        </div>

        {/* Eyebrow + headline */}
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#a78bfa", letterSpacing: ".06em", marginTop: 6 }}>
          YOU&apos;VE GENERATED 30 LOOKS
        </div>
        <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 29, letterSpacing: "-.025em", lineHeight: 1.05, marginTop: 10 }}>
          Free trial done.<br />Keep going for<br />NPR 399/mo.
        </h1>
        <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 10, lineHeight: 1.45 }}>
          That&apos;s one café coffee — for 100 fresh previews every month.
        </p>

        {/* Plans */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 20 }}>
          {/* Pro featured */}
          <div style={{ position: "relative", borderRadius: 16, padding: 15, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 16px 34px -14px rgba(124,58,237,.9)" }}>
            <div style={{ position: "absolute", top: 13, right: 14, fontFamily: "var(--font-space-mono)", fontSize: 9, background: "#fff", color: "#7c3aed", padding: "3px 8px", borderRadius: 7, fontWeight: 700 }}>POPULAR</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28 }}>NPR 399</span>
              <span style={{ fontSize: 12, color: "#e6dcff" }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: "#ece4ff", marginTop: 6 }}>10 sessions/mo · 100 previews · save & share</div>
          </div>

          {/* Free + Salon side by side */}
          <div style={{ display: "flex", gap: 11 }}>
            <div style={{ flex: 1, borderRadius: 14, padding: 13, background: "#15121f", border: "1px solid #2a2540" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Free</div>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 18, marginTop: 3 }}>NPR 0</div>
              <div style={{ fontSize: 11, color: "#9b94b8", marginTop: 4 }}>3 sessions, once</div>
            </div>
            <div style={{ flex: 1, borderRadius: 14, padding: 13, background: "#15121f", border: "1px solid #2a2540" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Salon</div>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 18, marginTop: 3 }}>NPR 2,999</div>
              <div style={{ fontSize: 11, color: "#9b94b8", marginTop: 4 }}>Unlimited · B2B</div>
            </div>
          </div>
        </div>

        {/* Lifetime deal */}
        <div style={{ marginTop: 14, borderRadius: 14, border: "1px dashed #fb7185", background: "rgba(251,113,133,.08)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#fb7185", letterSpacing: ".05em" }}>LAUNCH · FIRST 100 ONLY</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 3 }}>Lifetime Pro — NPR 1,999 once</div>
          </div>
          <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#fb7185", fontWeight: 700, flexShrink: 0 }}>41 left</span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
          <button style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontWeight: 700, fontSize: 15, color: "#fff", border: "none", cursor: "pointer", width: "100%", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}>
            Upgrade with Khalti
          </button>
          <div style={{ textAlign: "center", fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#6b6485" }}>
            SECURE · KHALTI WALLET &amp; CARD · CANCEL ANYTIME
          </div>
        </div>

      </div>
    </div>
    </AppShell>
  );
}
