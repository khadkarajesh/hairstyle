"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";

function UpgradeContent() {
  const searchParams = useSearchParams();
  const hitLimit = searchParams.get("reason") === "limit";

  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "radial-gradient(120% 70% at 50% 0%, #1b1230 0%, #0f0d17 55%)", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 44 }} />

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", padding: "14px 22px 22px", maxWidth: 390, width: "100%", margin: "0 auto" }}>

        {/* Close */}
        <div style={{ textAlign: "right" }}>
          <Link href="/upload" style={{ color: "#9b94b8", textDecoration: "none", fontSize: 20 }}>✕</Link>
        </div>

        {/* Eyebrow + headline */}
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#a78bfa", letterSpacing: ".06em", marginTop: 6 }}>
          {hitLimit ? "FREE SESSIONS USED" : "UPGRADE YOUR PLAN"}
        </div>
        <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, letterSpacing: "-.025em", lineHeight: 1.05, marginTop: 10 }}>
          {hitLimit
            ? <>Your 3 free<br />sessions are up.</>
            : <>See more looks,<br />every month.</>}
        </h1>
        <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 10, lineHeight: 1.5 }}>
          {hitLimit
            ? "Pick a plan to keep generating hairstyle previews on your actual face."
            : "One session = 10 hairstyle previews. Pick how many you want each month."}
        </p>

        {/* Plans */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 22 }}>

          {/* Standard — featured */}
          <div style={{ position: "relative", borderRadius: 16, padding: 16, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 16px 34px -14px rgba(124,58,237,.9)" }}>
            <div style={{ position: "absolute", top: 13, right: 14, fontFamily: "var(--font-space-mono)", fontSize: 9, background: "#fff", color: "#7c3aed", padding: "3px 8px", borderRadius: 7, fontWeight: 700 }}>MOST POPULAR</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Standard</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 30 }}>NPR 499</span>
              <span style={{ fontSize: 12, color: "#e6dcff" }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: "#ece4ff", marginTop: 6, lineHeight: 1.5 }}>
              3 sessions/month · 30 hairstyle previews<br />Save looks · Show Barber screen
            </div>
          </div>

          {/* Pro */}
          <div style={{ borderRadius: 16, padding: 16, background: "#15121f", border: "1px solid #2a2540" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 24 }}>NPR 799</span>
              <span style={{ fontSize: 12, color: "#9b94b8" }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: "#9b94b8", marginTop: 5, lineHeight: 1.5 }}>
              6 sessions/month · 60 previews · everything in Standard
            </div>
          </div>

          {/* Free tier reminder */}
          <div style={{ display: "flex", gap: 11 }}>
            <div style={{ flex: 1, borderRadius: 14, padding: 13, background: "#0f0d17", border: "1px solid #1e1a2e" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#6b6485" }}>Free</div>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 18, marginTop: 3, color: "#6b6485" }}>NPR 0</div>
              <div style={{ fontSize: 11, color: "#4a4568", marginTop: 4 }}>3 sessions · once</div>
            </div>
            <div style={{ flex: 1, borderRadius: 14, padding: 13, background: "#15121f", border: "1px solid #2a2540" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Salon</div>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 18, marginTop: 3 }}>NPR 2,999</div>
              <div style={{ fontSize: 11, color: "#9b94b8", marginTop: 4 }}>Unlimited · B2B</div>
            </div>
          </div>
        </div>

        {/* Lifetime deal */}
        <div style={{ marginTop: 14, borderRadius: 14, border: "1px dashed #fb7185", background: "rgba(251,113,133,.07)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#fb7185", letterSpacing: ".05em" }}>LAUNCH OFFER · FIRST 100 ONLY</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 3 }}>Lifetime Standard — NPR 1,999 once</div>
            <div style={{ fontSize: 11, color: "#9b94b8", marginTop: 2 }}>3 sessions/month, forever. No renewal.</div>
          </div>
          <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#fb7185", fontWeight: 700, flexShrink: 0 }}>41 left</span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 9 }}>
          <a
            href="https://wa.me/977XXXXXXXXXX?text=I%20want%20to%20upgrade%20HairStyle%20AI"
            target="_blank"
            rel="noopener noreferrer"
            style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "none", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}
          >
            Continue with Khalti →
          </a>
          <div style={{ textAlign: "center", fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#6b6485" }}>
            PAYMENT LAUNCHING SOON · CONTACT US ON WHATSAPP TO PAY
          </div>
        </div>

      </div>
    </div>
    </AppShell>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  );
}
