"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";

const PACKS = [
  { id: "value",   name: "Value Pack", sessions: 3, price: 499, perSession: 166, popular: true  },
  { id: "starter", name: "Starter",    sessions: 1, price: 199, perSession: 199, popular: false },
  { id: "pro",     name: "Pro Pack",   sessions: 5, price: 749, perSession: 150, popular: false },
] as const;

type PackId = (typeof PACKS)[number]["id"];

function UpgradeContent() {
  const searchParams = useSearchParams();
  const hitLimit = searchParams.get("reason") === "limit";
  const [selected, setSelected] = useState<PackId>("value");

  const pack = PACKS.find(p => p.id === selected)!;
  const waMsg = encodeURIComponent(
    `Hi, I want to buy the ${pack.name} (${pack.sessions} session${pack.sessions > 1 ? "s" : ""}) for NPR ${pack.price} on HairStyle AI`
  );

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
          {hitLimit ? "FREE SESSION USED" : "GET MORE SESSIONS"}
        </div>
        <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, letterSpacing: "-.025em", lineHeight: 1.05, marginTop: 10 }}>
          {hitLimit
            ? <>Your free session<br />is used up.</>
            : <>Buy sessions,<br />use when ready.</>}
        </h1>
        <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 10, lineHeight: 1.5 }}>
          Credits never expire. Each session = 10 hairstyle previews personalised to what you liked last time.
        </p>

        {/* Pack selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>

          {PACKS.map(p => {
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                style={{
                  position: "relative", borderRadius: 16, padding: 16, textAlign: "left",
                  background: isSelected ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "#15121f",
                  border: isSelected ? "none" : "1px solid #2a2540",
                  boxShadow: isSelected ? "0 16px 34px -14px rgba(124,58,237,.9)" : "none",
                  cursor: "pointer", width: "100%",
                }}
              >
                {p.popular && (
                  <div style={{ position: "absolute", top: 13, right: 14, fontFamily: "var(--font-space-mono)", fontSize: 9, background: isSelected ? "#fff" : "#7c3aed", color: isSelected ? "#7c3aed" : "#fff", padding: "3px 8px", borderRadius: 7, fontWeight: 700 }}>
                    BEST VALUE
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: 15, color: isSelected ? "#fff" : "#f4f2fb" }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, color: isSelected ? "#fff" : "#f4f2fb" }}>NPR {p.price}</span>
                  <span style={{ fontSize: 12, color: isSelected ? "#e6dcff" : "#9b94b8" }}>· {p.sessions} session{p.sessions > 1 ? "s" : ""}</span>
                </div>
                <div style={{ fontSize: 11, color: isSelected ? "#ece4ff" : "#6b6485", marginTop: 4 }}>
                  NPR {p.perSession}/session · never expires
                </div>
              </button>
            );
          })}

          {/* Free tier reminder */}
          <div style={{ borderRadius: 14, padding: 13, background: "#0f0d17", border: "1px solid #1e1a2e" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#6b6485" }}>Free</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 18, marginTop: 3, color: "#6b6485" }}>NPR 0</div>
            <div style={{ fontSize: 11, color: "#4a4568", marginTop: 4 }}>1 session · save looks · Show Barber · no card needed</div>
          </div>
        </div>

        {/* What's included */}
        <div style={{ marginTop: 16, borderRadius: 12, background: "#13101e", border: "1px solid #221e33", padding: "12px 14px" }}>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#a78bfa", letterSpacing: ".05em", marginBottom: 8 }}>EVERY PAID SESSION INCLUDES</div>
          {[
            "10 hairstyle previews on your actual face",
            "Left & right angle views",
            "Download your looks",
            "Personalised based on what you saved last time",
          ].map(item => (
            <div key={item} style={{ fontSize: 12, color: "#9b94b8", display: "flex", gap: 8, marginBottom: 5 }}>
              <span style={{ color: "#a78bfa", flexShrink: 0 }}>✓</span>{item}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 9 }}>
          <a
            href={`https://wa.me/9779849696795?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg,#25d366,#128c7e)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "none", boxShadow: "0 12px 26px -10px rgba(37,211,102,.5)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Pay via WhatsApp — NPR {pack.price}
          </a>
          <div style={{ textAlign: "center", fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#6b6485" }}>
            MESSAGE US · WE ACTIVATE YOUR PLAN WITHIN 1 HOUR
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
