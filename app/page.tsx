import Link from "next/link";
import { STYLES, stripeBg } from "@/lib/styles-data";
import { createClient } from "@/lib/supabase/server";

const HAS_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PACKS = [
  { name: "Starter",    sessions: 1, price: 199, popular: false },
  { name: "Value Pack", sessions: 3, price: 499, popular: true  },
  { name: "Pro Pack",   sessions: 5, price: 749, popular: false },
];

export default async function LandingPage() {
  let isLoggedIn = false;
  if (HAS_SUPABASE) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      isLoggedIn = !!user;
    } catch {}
  }

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
            {isLoggedIn
              ? <Link href="/session/latest" className="l-nav-login" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>My looks</Link>
              : <Link href="/login" className="l-nav-login" style={{ color: "#9b94b8", textDecoration: "none" }}>Log in</Link>
            }
          </div>
          {isLoggedIn
            ? <Link href="/upload" className="l-nav-cta" style={{ fontSize: 14 }}>New session</Link>
            : <Link href="/login" className="l-nav-cta" style={{ fontSize: 14 }}>Start free</Link>
          }
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero">
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", background: "#1c172b", border: "1px solid #2a2540", padding: "7px 13px", borderRadius: 99, letterSpacing: ".04em" }}>
            🇳🇵 MADE IN KATHMANDU · EARLY ACCESS
          </div>
          <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(32px, 8.5vw, 62px)", letterSpacing: "-.03em", lineHeight: .98, margin: "22px 0 0", maxWidth: "100%" }}>
            See your next haircut<br />before the scissors touch.
          </h1>
          <p style={{ fontSize: 18, color: "#9b94b8", margin: "22px 0 0", lineHeight: 1.55, maxWidth: "min(480px, 100%)" }}>
            Upload 3 photos. AI reads your face shape and renders up to 12 matching hairstyles directly on your face — then show the result to your barber.
          </p>
          <div className="l-hero-btns" style={{ display: "flex", gap: 14, marginTop: 32 }}>
            {isLoggedIn ? (
              <>
                <Link href="/upload" style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", padding: "16px 28px", borderRadius: 13, fontWeight: 700, fontSize: 16, color: "#fff", textDecoration: "none", boxShadow: "0 16px 32px -12px rgba(124,58,237,.85)", display: "inline-block", whiteSpace: "nowrap" }}>
                  New session →
                </Link>
                <Link href="/session/latest" style={{ padding: "16px 26px", borderRadius: 13, fontWeight: 700, fontSize: 16, border: "1px solid #2a2540", color: "#cdc6e3", background: "transparent", whiteSpace: "nowrap", textDecoration: "none", display: "inline-block" }}>
                  My looks ↗
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", padding: "16px 28px", borderRadius: 13, fontWeight: 700, fontSize: 16, color: "#fff", textDecoration: "none", boxShadow: "0 16px 32px -12px rgba(124,58,237,.85)", display: "inline-block", whiteSpace: "nowrap" }}>
                  Try free — 1 session →
                </Link>
                <a href="#how" style={{ padding: "16px 26px", borderRadius: 13, fontWeight: 700, fontSize: 16, border: "1px solid #2a2540", color: "#cdc6e3", background: "transparent", cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none", display: "inline-block" }}>
                  See how it works ↓
                </a>
              </>
            )}
          </div>
          <div className="l-hero-trust">
            NO CARD NEEDED · 1 FREE SESSION · PHOTOS STORED SECURELY
          </div>
        </div>

        {/* Hero visual — phone mockup showing the before/after + style grid */}
        <div className="l-hero-visual">
          {/* Phone frame */}
          <div style={{ position: "absolute", right: 20, top: 10, width: 220, height: 410, borderRadius: 32, background: "#0b0912", border: "2px solid #2a2540", boxShadow: "0 32px 80px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04)", overflow: "hidden", zIndex: 2 }}>
            {/* Status bar */}
            <div style={{ height: 32, background: "#0d0b19", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "#4a4568" }}>9:41</span>
              <div style={{ width: 60, height: 14, borderRadius: 7, background: "#1a1730" }} />
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "#4a4568" }}>●●●</span>
            </div>
            {/* Before/after comparison area */}
            <div style={{ position: "relative", height: 240, overflow: "hidden" }}>
              {/* Before half */}
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,#23222a,#23222a 8px,#28272f 8px,#28272f 16px)" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 80, height: 80, borderRadius: "50%", border: "1.5px dashed rgba(255,255,255,.15)" }} />
              </div>
              {/* After half (clipped) */}
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "55%", overflow: "hidden" }}>
                <div style={{ width: 220, height: 240, background: "repeating-linear-gradient(135deg,oklch(0.3 0.09 292),oklch(0.3 0.09 292) 8px,oklch(0.36 0.11 292) 8px,oklch(0.36 0.11 292) 16px)", position: "absolute", top: 0, left: 0 }}>
                  <div style={{ position: "absolute", top: "50%", left: "60%", transform: "translate(-50%,-50%)", width: 80, height: 80, borderRadius: "50%", border: "1.5px dashed rgba(167,139,250,.4)" }}>
                    {/* Hair shape hint */}
                    <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", width: 62, height: 22, borderRadius: "50% 50% 0 0", background: "rgba(167,139,250,.35)", borderTop: "1.5px solid rgba(167,139,250,.5)" }} />
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "55%", width: 2, background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,.4)", zIndex: 3 }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 28, height: 28, borderRadius: "50%", background: "#fff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}>⟺</div>
              </div>
              {/* Labels */}
              <div style={{ position: "absolute", left: 8, bottom: 8, fontFamily: "var(--font-space-mono)", fontSize: 8, background: "rgba(0,0,0,.6)", padding: "3px 6px", borderRadius: 5, color: "#9b94b8", zIndex: 2 }}>BEFORE</div>
              <div style={{ position: "absolute", right: 72, bottom: 8, fontFamily: "var(--font-space-mono)", fontSize: 8, background: "rgba(124,58,237,.7)", padding: "3px 6px", borderRadius: 5, color: "#fff", zIndex: 2 }}>AFTER</div>
            </div>
            {/* Style name */}
            <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #1e1a2e" }}>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 14 }}>Textured Crop</div>
              <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#a78bfa", marginTop: 2 }}>K-STYLE · OVAL FACE</div>
            </div>
            {/* Mini style grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, padding: "8px 10px" }}>
              {STYLES.slice(0, 8).map((s, i) => (
                <div key={s.id} style={{ aspectRatio: "3/4", borderRadius: 7, background: stripeBg(s.hue), border: i === 0 ? "1.5px solid #a78bfa" : "none", opacity: i === 0 ? 1 : 0.6 }} />
              ))}
            </div>
          </div>

          {/* Floating face-shape badge */}
          <div style={{ position: "absolute", left: 10, top: 40, background: "#181527", border: "1px solid #2a2540", borderRadius: 12, padding: "10px 13px", boxShadow: "0 14px 28px -12px rgba(0,0,0,.6)", zIndex: 3, animation: "hsFloat 5s ease-in-out infinite" }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#6b6485", letterSpacing: ".04em" }}>DETECTED</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 16, marginTop: 2 }}>Oval face</div>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#34d399", marginTop: 3 }}>✓ 9 styles matched</div>
          </div>

          {/* Floating barber badge */}
          <div style={{ position: "absolute", left: 0, bottom: 30, background: "#0d1a14", border: "1px solid #34d399", borderRadius: 12, padding: "10px 13px", boxShadow: "0 14px 28px -12px rgba(0,0,0,.5)", zIndex: 3, animation: "hsFloat 4s ease-in-out 1.5s infinite" }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#34d399", letterSpacing: ".04em" }}>✂ SHOW BARBER</div>
            <div style={{ fontSize: 11, color: "#a7f3d0", marginTop: 3 }}>No printing needed</div>
          </div>

          {/* Render time badge */}
          <div style={{ position: "absolute", right: 0, bottom: 60, background: "#181527", border: "1px solid #2a2540", borderRadius: 12, padding: "10px 13px", boxShadow: "0 16px 30px -14px rgba(0,0,0,.6)", zIndex: 1 }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#a78bfa" }}>RENDERED IN</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>~60 sec</div>
          </div>

          <style>{`@keyframes hsFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }`}</style>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="l-section">
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", letterSpacing: ".08em", textAlign: "center" }}>HOW IT WORKS</div>
        <h2 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.025em", textAlign: "center", margin: "10px 0 0" }}>Three photos to certainty.</h2>
        <div className="l-steps-grid">
          {([
            ["01", "📸", "Upload 3 photos", "Front, left profile, and right profile. The app guides you on angle and framing for the best results."],
            ["02", "🧠", "AI reads your face shape", "We detect your face shape, hair type, and density — then select the 6–12 styles most likely to suit you specifically."],
            ["03", "✂", "Compare & show your barber", "Slide between before and after. Save your favourite. Show the screen to your barber — no printing, no guessing."],
          ] as const).map(([num, icon, title, desc]) => (
            <div key={num} style={{ background: "#15121f", border: "1px solid #2a2540", borderRadius: 18, padding: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 26, color: "#a78bfa" }}>{num}</div>
                <div style={{ fontSize: 24 }}>{icon}</div>
              </div>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 19, marginTop: 14, letterSpacing: "-.01em" }}>{title}</div>
              <div style={{ fontSize: 14, color: "#9b94b8", marginTop: 8, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Style showcase */}
      <section className="l-showcase-section">
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#6b6485", letterSpacing: ".06em", marginBottom: 6, textAlign: "center" }}>{STYLES.length} STYLES AVAILABLE</div>
        <p style={{ textAlign: "center", fontSize: 13, color: "#4a4568", marginBottom: 16 }}>Each one rendered on your actual face — not a simulation.</p>
        <div className="l-showcase-grid">
          {STYLES.map(s => (
            <div key={s.id} style={{ position: "relative", borderRadius: 13, overflow: "hidden", aspectRatio: "3/4", background: stripeBg(s.hue), boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }}>
              {/* Stylised silhouette */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
                <div style={{ width: 36, height: 10, borderRadius: "50% 50% 0 0", background: "rgba(255,255,255,.15)", marginBottom: 0 }} />
                <div style={{ width: 30, height: 38, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.04)" }} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "22px 9px 8px", background: "linear-gradient(transparent,rgba(6,4,14,.94))" }}>
                <div style={{ fontWeight: 700, fontSize: 11 }}>{s.name}</div>
                <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "#ab9fd0", marginTop: 1 }}>{s.tag}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#4a4568", marginTop: 14 }}>Thumbnails show placeholders — your AI-generated previews replace these in-app.</p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="l-section">
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", letterSpacing: ".08em", textAlign: "center" }}>PRICING</div>
        <h2 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.025em", textAlign: "center", margin: "10px 0 0" }}>Less than a bad haircut.</h2>
        <p style={{ textAlign: "center", fontSize: 14, color: "#9b94b8", marginTop: 10 }}>Buy session credits when you need them. They never expire.</p>

        <div className="l-pricing-grid">
          {/* Free */}
          <div style={{ background: "#15121f", border: "1px solid #2a2540", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#6b6485", letterSpacing: ".06em" }}>FREE FOREVER</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginTop: 8 }}>Try it out</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.02em", marginTop: 10 }}>NPR 0</div>
            <div style={{ height: 1, background: "#2a2540", margin: "18px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#cdc6e3", flex: 1 }}>
              <div>✓ 1 session, no card needed</div>
              <div>✓ Up to 12 styles on your face</div>
              <div>✓ Before/after comparison slider</div>
              <div>✓ Save & show barber screen</div>
            </div>
            <Link href="/login" style={{ marginTop: 22, height: 46, borderRadius: 12, border: "1px solid #3a3358", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#cdc6e3", textDecoration: "none" }}>Start free</Link>
          </div>

          {/* Paid packs */}
          {PACKS.map(p => (
            <div key={p.name} style={{ background: p.popular ? "linear-gradient(160deg,#241846,#15121f)" : "#15121f", border: p.popular ? "1.5px solid #7c3aed" : "1px solid #2a2540", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", position: "relative", boxShadow: p.popular ? "0 24px 50px -22px rgba(124,58,237,.7)" : "none" }}>
              {p.popular && (
                <div style={{ position: "absolute", top: -12, left: 24, fontFamily: "var(--font-space-mono)", fontSize: 10, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", padding: "5px 11px", borderRadius: 8, fontWeight: 700 }}>BEST VALUE</div>
              )}
              <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: p.popular ? "#cdbfff" : "#6b6485", letterSpacing: ".06em" }}>CREDIT PACK</div>
              <div style={{ fontWeight: 700, fontSize: 17, marginTop: 8 }}>{p.name}</div>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.02em", marginTop: 10 }}>NPR {p.price}</div>
              <div style={{ fontSize: 13, color: p.popular ? "#cdbfff" : "#9b94b8", marginTop: 4 }}>{p.sessions} session{p.sessions > 1 ? "s" : ""} · NPR {Math.round(p.price / p.sessions)}/session</div>
              <div style={{ height: 1, background: p.popular ? "#3a2f5a" : "#2a2540", margin: "18px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: p.popular ? "#ece4ff" : "#cdc6e3", flex: 1 }}>
                <div>✓ {p.sessions} full session{p.sessions > 1 ? "s" : ""}</div>
                <div>✓ Up to 12 styles per session</div>
                <div>✓ Front, left & right angle views</div>
                <div>✓ Download & share your looks</div>
                <div>✓ Credits never expire</div>
                {p.sessions >= 3 && <div>✓ Gets smarter each session</div>}
              </div>
              <Link href="/upgrade" style={{ marginTop: 22, height: 46, borderRadius: 12, background: p.popular ? "linear-gradient(135deg,#8b5cf6,#7c3aed)" : "transparent", border: p.popular ? "none" : "1px solid #3a3358", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: p.popular ? "#fff" : "#cdc6e3", textDecoration: "none", boxShadow: p.popular ? "0 12px 26px -10px rgba(124,58,237,.85)" : "none" }}>
                Buy via WhatsApp
              </Link>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#4a4568" }}>
          PAY VIA FONEPAY · ESEWA · CASH · ACTIVATED WITHIN 1 HOUR
        </div>
      </section>

      {/* FAQ / trust strip */}
      <section className="l-section" style={{ borderTop: "1px solid #1c172b" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, maxWidth: 860, margin: "0 auto" }}>
          {([
            ["🔒", "Your photos are private", "Uploads are stored securely and never shared. Delete them any time from your profile."],
            ["✂", "Show your barber directly", "No printing needed. Open the app at the barber chair and show them the screen."],
            ["🧠", "Learns your taste", "Each session builds on what you saved and showed your barber — recommendations improve over time."],
            ["📍", "Built for Nepal", "Designed for South Asian hair textures and face shapes. Prices in NPR, support via WhatsApp."],
          ] as const).map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 14 }}>
              <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#9b94b8", marginTop: 5, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <div style={{ margin: "0 48px 50px", borderRadius: 20, background: "linear-gradient(135deg,#1e1540,#2a1060)", border: "1px solid #3a2f5a", padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, boxShadow: "0 24px 60px -20px rgba(124,58,237,.4)" }} className="l-deal">
        <div>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", letterSpacing: ".06em" }}>FREE · NO CARD NEEDED</div>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 32, letterSpacing: "-.02em", marginTop: 10, lineHeight: 1.05 }}>See your new look<br />before you commit.</div>
          <div style={{ fontSize: 14, color: "#9b94b8", marginTop: 10 }}>Upload 3 photos. Get results in 60 seconds.</div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <Link href="/login" style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", padding: "16px 32px", borderRadius: 14, fontWeight: 700, fontSize: 16, color: "#fff", textDecoration: "none", display: "inline-block", boxShadow: "0 16px 36px -12px rgba(124,58,237,.9)", whiteSpace: "nowrap" }}>
            Try free →
          </Link>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#6b6485", marginTop: 10 }}>1 FREE SESSION · NO CARD</div>
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
          <a
            href="https://wa.me/9779849696795?text=Hi%2C%20I%20have%20a%20question%20about%20HairStyle%20AI"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#6b6485", textDecoration: "none" }}
          >Contact</a>
        </div>
      </footer>
    </div>
  );
}
