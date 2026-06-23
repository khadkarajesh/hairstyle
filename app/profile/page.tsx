import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";

const SESSIONS = [
  { label: "Session 01", meta: "JUN 21 · 10 LOOKS · 3 SAVED", hue1: 292, hue2: 312 },
  { label: "Trial run",  meta: "JUN 14 · 10 LOOKS · 1 SAVED", hue1: 278, hue2: 330 },
];

const SAVED_HUES = [292, 330, 278];

function stripeMini(hue: number) {
  return `repeating-linear-gradient(135deg,oklch(0.27 0.06 ${hue}),oklch(0.27 0.06 ${hue}) 6px,oklch(0.33 0.085 ${hue}) 6px,oklch(0.33 0.085 ${hue}) 12px)`;
}

export default function ProfilePage() {
  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", paddingBottom: 80 }}>
      <div style={{ height: 44 }} />

      <div style={{ maxWidth: 390, margin: "0 auto", padding: "14px 20px 0" }}>

        {/* Avatar row */}
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 22, flexShrink: 0 }}>A</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 20, letterSpacing: "-.01em" }}>Aayush Shrestha</div>
            <div style={{ fontSize: 12, color: "#9b94b8" }}>aayush@gmail.com</div>
          </div>
          <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#cdbfff", background: "#221c33", border: "1px solid #3a3358", padding: "5px 9px", borderRadius: 8 }}>FREE</span>
        </div>

        {/* Usage card */}
        <div style={{ marginTop: 18, background: "#15121f", border: "1px solid #2a2540", borderRadius: 16, padding: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: "#9b94b8", fontWeight: 600 }}>Sessions used</span>
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12 }}>1 / 3 lifetime</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#211d33", marginTop: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "33%", background: "linear-gradient(90deg,#a78bfa,#7c3aed)", borderRadius: 3 }} />
          </div>
          <Link href="/upgrade" style={{ marginTop: 13, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff", textDecoration: "none" }}>
            Upgrade to Pro — 10/mo
          </Link>
        </div>

        {/* Sessions list */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 16 }}>Your sessions</div>
          <button style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>See all</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {SESSIONS.map(s => (
            <Link key={s.label} href="/session/demo" style={{ display: "flex", alignItems: "center", gap: 12, background: "#15121f", border: "1px solid #2a2540", borderRadius: 13, padding: 9, textDecoration: "none", color: "#f4f2fb" }}>
              <div style={{ display: "flex", gap: 3 }}>
                <div style={{ width: 30, height: 38, borderRadius: 6, background: stripeMini(s.hue1) }} />
                <div style={{ width: 30, height: 38, borderRadius: 6, background: stripeMini(s.hue2) }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#9b94b8", marginTop: 2 }}>{s.meta}</div>
              </div>
              <span style={{ color: "#6b6485", fontSize: 16 }}>›</span>
            </Link>
          ))}
        </div>

        {/* Saved looks */}
        <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 16, marginTop: 20 }}>Saved looks</div>
        <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
          {SAVED_HUES.map((hue, i) => (
            <div key={i} style={{ flex: 1, aspectRatio: "3/4", borderRadius: 11, background: `repeating-linear-gradient(135deg,oklch(0.3 0.07 ${hue}),oklch(0.3 0.07 ${hue}) 7px,oklch(0.36 0.09 ${hue}) 7px,oklch(0.36 0.09 ${hue}) 14px)` }} />
          ))}
        </div>

      </div>

      <BottomNav />
    </div>
    </AppShell>
  );
}
