import Link from "next/link";
import { STYLES, stripeBg } from "@/lib/styles-data";

export default function LandingPage() {
  return (
    <div style={{ background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", minHeight: "100vh", maxWidth: "100vw", overflowX: "hidden" }}>

      {/* Nav */}
      <nav className="l-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow: "0 6px 16px -4px rgba(124,58,237,.7)", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 18, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>HairStyle AI</span>
        </div>
        <div className="l-nav-links">
          <div className="l-nav-links-text">
            <a href="#how" style={{ color: "#cdc6e3", textDecoration: "none" }}>How it works</a>
            <a href="#pricing" style={{ color: "#cdc6e3", textDecoration: "none" }}>Pricing</a>
            <a href="#salons" style={{ color: "#cdc6e3", textDecoration: "none" }}>For salons</a>
            <Link href="/login" className="l-nav-login" style={{ color: "#9b94b8", textDecoration: "none" }}>Log in</Link>
          </div>
          <Link href="/login" className="l-nav-cta" style={{ fontSize: 14 }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero">
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", background: "#1c172b", border: "1px solid #2a2540", padding: "7px 13px", borderRadius: 99, letterSpacing: ".04em" }}>
            🇳🇵 NEPAL · 2,400+ PROFESSIONALS
          </div>
          <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(32px, 8.5vw, 62px)", letterSpacing: "-.03em", lineHeight: .98, margin: "22px 0 0", maxWidth: "100%" }}>
            See your next haircut before the scissors touch.
          </h1>
          <p style={{ fontSize: 18, color: "#9b94b8", margin: "22px 0 0", lineHeight: 1.5, maxWidth: "min(480px, 100%)" }}>
            Upload 3 photos. Our AI renders 10 hairstyles on your actual face in 60 seconds. No more guessing. No more bad cuts.
          </p>
          <div className="l-hero-btns" style={{ display: "flex", gap: 14, marginTop: 32 }}>
            <Link href="/login" style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", padding: "16px 28px", borderRadius: 13, fontWeight: 700, fontSize: 16, color: "#fff", textDecoration: "none", boxShadow: "0 16px 32px -12px rgba(124,58,237,.85)", display: "inline-block", whiteSpace: "nowrap" }}>
              Try 3 free sessions →
            </Link>
            <button style={{ padding: "16px 26px", borderRadius: 13, fontWeight: 700, fontSize: 16, border: "1px solid #2a2540", color: "#cdc6e3", background: "transparent", cursor: "pointer", whiteSpace: "nowrap" }}>
              Watch a demo
            </button>
          </div>
          <div className="l-hero-trust">
            NO CARD · PHOTOS DELETED IN 24H · KHALTI SECURED
          </div>
        </div>

        {/* Hero visual — hidden on mobile via CSS */}
        <div className="l-hero-visual">
          <div style={{ position: "absolute", left: 0, top: 30, width: 210, height: 280, borderRadius: 18, overflow: "hidden", background: "repeating-linear-gradient(135deg,#23222a,#23222a 10px,#2b2a33 10px,#2b2a33 20px)", boxShadow: "0 24px 50px -18px rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.2)" }} />
            </div>
            <div style={{ position: "absolute", left: 12, bottom: 12, fontFamily: "var(--font-space-mono)", fontSize: 10, background: "rgba(0,0,0,.5)", padding: "5px 9px", borderRadius: 8, color: "#cfcfd6" }}>BEFORE</div>
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, width: 235, height: 312, borderRadius: 18, overflow: "hidden", background: "repeating-linear-gradient(135deg,oklch(0.3 0.08 292),oklch(0.3 0.08 292) 10px,oklch(0.37 0.1 292) 10px,oklch(0.37 0.1 292) 20px)", boxShadow: "0 28px 60px -16px rgba(124,58,237,.55)", border: "1px solid rgba(167,139,250,.3)", animation: "hsFloat 4s ease-in-out infinite" }}>
            <div style={{ position: "absolute", top: 12, left: 12, fontFamily: "var(--font-space-mono)", fontSize: 9, background: "rgba(8,5,18,.5)", color: "#cdbfff", padding: "4px 8px", borderRadius: 7 }}>AI · TEXTURED CROP</div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 94, height: 94, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.34)" }} />
            </div>
            <div style={{ position: "absolute", left: 12, bottom: 12, fontFamily: "var(--font-space-mono)", fontSize: 10, background: "rgba(124,58,237,.65)", padding: "5px 9px", borderRadius: 8, color: "#fff" }}>AFTER</div>
          </div>
          <div style={{ position: "absolute", right: 60, bottom: 8, background: "#181527", border: "1px solid #2a2540", borderRadius: 13, padding: "11px 15px", boxShadow: "0 16px 30px -14px rgba(0,0,0,.6)" }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa" }}>RENDERED IN</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>58 sec</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="l-section">
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", letterSpacing: ".08em", textAlign: "center" }}>HOW IT WORKS</div>
        <h2 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.025em", textAlign: "center", margin: "10px 0 0" }}>Three photos to certainty</h2>
        <div className="l-steps-grid">
          {[
            ["01", "Upload 3 photos", "Front, left, and right. A guided screen makes sure they're good enough for great results."],
            ["02", "AI reads your face", "We detect your face shape and match the 10 styles most likely to suit you."],
            ["03", "Compare & decide", "Swipe between your photo and each look. Save the winner. Show it to your barber."],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ background: "#15121f", border: "1px solid #2a2540", borderRadius: 18, padding: 26 }}>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 30, color: "#a78bfa" }}>{num}</div>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 19, marginTop: 14, letterSpacing: "-.01em" }}>{title}</div>
              <div style={{ fontSize: 14, color: "#9b94b8", marginTop: 8, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Style showcase */}
      <section className="l-showcase-section">
        <div className="l-showcase-grid">
          {STYLES.map(s => (
            <div key={s.id} style={{ position: "relative", borderRadius: 13, overflow: "hidden", aspectRatio: "3/4", background: stripeBg(s.hue), boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.2)" }} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "22px 9px 8px", background: "linear-gradient(transparent,rgba(6,4,14,.92))" }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}</div>
                <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "#ab9fd0", marginTop: 1 }}>{s.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="l-section">
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", letterSpacing: ".08em", textAlign: "center" }}>PRICING</div>
        <h2 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.025em", textAlign: "center", margin: "10px 0 0" }}>Less than a bad haircut</h2>
        <div className="l-pricing-grid">
          <div style={{ background: "#15121f", border: "1px solid #2a2540", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>Free</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.02em", marginTop: 10 }}>NPR 0</div>
            <div style={{ fontSize: 13, color: "#9b94b8", marginTop: 6 }}>Try before you buy</div>
            <div style={{ height: 1, background: "#2a2540", margin: "20px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 14, color: "#cdc6e3", flex: 1 }}>
              <div>✓ 3 sessions, lifetime</div>
              <div>✓ 30 previews total</div>
              <div>✓ Compare & save</div>
            </div>
            <Link href="/login" style={{ marginTop: 24, height: 46, borderRadius: 12, border: "1px solid #3a3358", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#cdc6e3", textDecoration: "none" }}>Start free</Link>
          </div>
          <div style={{ background: "linear-gradient(160deg,#241846,#15121f)", border: "1.5px solid #7c3aed", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 24px 50px -22px rgba(124,58,237,.7)" }}>
            <div style={{ position: "absolute", top: -12, left: 28, fontFamily: "var(--font-space-mono)", fontSize: 10, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", padding: "5px 11px", borderRadius: 8, fontWeight: 700 }}>MOST POPULAR</div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
              <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.02em" }}>NPR 399</span>
              <span style={{ fontSize: 13, color: "#cdc6e3" }}>/mo</span>
            </div>
            <div style={{ fontSize: 13, color: "#cdbfff", marginTop: 6 }}>For individuals who care how they look</div>
            <div style={{ height: 1, background: "#3a2f5a", margin: "20px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 14, color: "#ece4ff", flex: 1 }}>
              <div>✓ 10 sessions / month</div>
              <div>✓ 100 previews / month</div>
              <div>✓ Save, share & history</div>
              <div>✓ Priority rendering</div>
            </div>
            <Link href="/upgrade" style={{ marginTop: 24, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", textDecoration: "none", boxShadow: "0 12px 26px -10px rgba(124,58,237,.85)" }}>Go Pro</Link>
          </div>
          <div id="salons" style={{ background: "#15121f", border: "1px solid #2a2540", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>Salon</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
              <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.02em" }}>NPR 2,999</span>
              <span style={{ fontSize: 13, color: "#9b94b8" }}>/mo</span>
            </div>
            <div style={{ fontSize: 13, color: "#9b94b8", marginTop: 6 }}>A consultation tool for your chair</div>
            <div style={{ height: 1, background: "#2a2540", margin: "20px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 14, color: "#cdc6e3", flex: 1 }}>
              <div>✓ Unlimited sessions</div>
              <div>✓ In-salon client previews</div>
              <div>✓ Branded share cards</div>
            </div>
            <a href="mailto:hello@hairstyleai.com.np" style={{ marginTop: 24, height: 46, borderRadius: 12, border: "1px solid #3a3358", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#cdc6e3", textDecoration: "none" }}>Talk to us</a>
          </div>
        </div>
      </section>

      {/* Lifetime deal */}
      <div className="l-deal">
        <div>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#fb7185", letterSpacing: ".06em" }}>LAUNCH OFFER · FIRST 100 ONLY</div>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 32, letterSpacing: "-.02em", marginTop: 10 }}>Lifetime Pro for NPR 1,999 — once.</div>
          <div style={{ fontSize: 14, color: "#9b94b8", marginTop: 8 }}>Pay once, keep Pro forever. When 100 are gone, they&apos;re gone.</div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 46, letterSpacing: "-.02em", color: "#fb7185", lineHeight: 1 }}>41</div>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#9b94b8" }}>SPOTS LEFT</div>
          <Link href="/upgrade?deal=lifetime" style={{ marginTop: 14, background: "linear-gradient(135deg,#fb7185,#e11d48)", padding: "14px 26px", borderRadius: 13, fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "none", display: "inline-block", boxShadow: "0 14px 30px -12px rgba(251,113,133,.7)" }}>
            Claim lifetime deal
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="l-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: "#cdc6e3" }}>HairStyle AI</span>
          <span>· Made in Kathmandu</span>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <a href="#" style={{ color: "#6b6485", textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ color: "#6b6485", textDecoration: "none" }}>Terms</a>
          <a href="#" style={{ color: "#6b6485", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
