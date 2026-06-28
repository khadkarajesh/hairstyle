import Link from "next/link";
import Image from "next/image";
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
          <Image src="/icon.png" alt="Banlah" width={30} height={30} style={{ borderRadius: 9, flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 18, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>Banlah</span>
        </div>
        <div className="l-nav-links">
          <div className="l-nav-links-text">
            <a href="#how" style={{ color: "#cdc6e3", textDecoration: "none" }}>How it works</a>
            <a href="#pricing" style={{ color: "#cdc6e3", textDecoration: "none" }}>Pricing</a>
            <a href="#faq" style={{ color: "#cdc6e3", textDecoration: "none" }}>FAQ</a>
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
          <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(32px, 8.5vw, 62px)", letterSpacing: "-.03em", lineHeight: .98, margin: "0", maxWidth: "100%" }}>
            See your next haircut<br />before the scissors touch.
          </h1>
          <p style={{ fontSize: 18, color: "#9b94b8", margin: "22px 0 0", lineHeight: 1.55, maxWidth: "min(480px, 100%)" }}>
            Upload 3 photos. AI reads your face shape and renders matching hairstyles directly on your face — then show the result to your barber.
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

        {/* Hero visual — real app screenshot in phone frame */}
        <div className="l-hero-visual">
          {/* Phone frame */}
          <div style={{ position: "absolute", right: 20, top: 10, width: 220, height: 410, borderRadius: 32, background: "#0b0912", border: "2px solid #2a2540", boxShadow: "0 32px 80px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04)", overflow: "hidden", zIndex: 2 }}>
            <Image
              src="/generated-image.png"
              alt="AI-generated hairstyle preview — Textured Crop on a real face"
              width={784}
              height={1216}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
              priority
            />
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
            ["02", "🧠", "AI reads your face shape", "We detect your face shape, hair type, and density — then select the styles most likely to suit you specifically. Paid sessions unlock up to 12."],
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

      {/* Why it works — problem vs solution */}
      <section className="l-section">
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", letterSpacing: ".08em", textAlign: "center" }}>THE PROBLEM WE SOLVE</div>
        <h2 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.025em", textAlign: "center", margin: "10px 0 0" }}>Reference photos lie.<br />Your face doesn&apos;t.</h2>
        <p style={{ textAlign: "center", fontSize: 15, color: "#9b94b8", margin: "14px auto 0", lineHeight: 1.55, maxWidth: 520 }}>
          Every style photo you find online is on a different face, different hair texture, different lighting. You can&apos;t picture yourself in it — until now.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 36, maxWidth: 820, margin: "36px auto 0" }}>
          {/* Old way */}
          <div style={{ background: "#15121f", border: "1px solid #2a2540", borderRadius: 18, padding: "28px 26px" }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#fb7185", letterSpacing: ".08em" }}>THE OLD WAY</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 20, marginTop: 10 }}>Guesswork at the chair</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18, fontSize: 14, color: "#6b6485", lineHeight: 1.4 }}>
              <div>✗ Screenshot a random Western celebrity</div>
              <div>✗ Show barber a face that looks nothing like yours</div>
              <div>✗ &ldquo;Make it look like that&rdquo; — it never does</div>
              <div>✗ Walk out disappointed. Wait 6 weeks to try again.</div>
            </div>
          </div>
          {/* New way */}
          <div style={{ background: "linear-gradient(160deg,#1a1340,#15121f)", border: "1.5px solid #7c3aed", borderRadius: 18, padding: "28px 26px", boxShadow: "0 20px 50px -20px rgba(124,58,237,.45)" }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#34d399", letterSpacing: ".08em" }}>THE BANLAH WAY</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 20, marginTop: 10 }}>Certainty before scissors</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18, fontSize: 14, color: "#cdc6e3", lineHeight: 1.4 }}>
              <div>✓ AI renders the style <strong>on your actual face</strong></div>
              <div>✓ Matched to <strong>your face shape</strong> and hair texture</div>
              <div>✓ Show barber the screen — no printing, no confusion</div>
              <div>✓ Get the cut you actually wanted. First time.</div>
            </div>
          </div>
        </div>

        {/* 25 styles callout */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 36 }}>
          {([
            ["K-Pop", "Comma Hair · Curtain Fringe · Wolf Cut · Middle Part · Korean Perm"],
            ["Barbershop", "Taper Fade · High Skin Fade · Crew Cut · Buzz Cut · Edgar Cut"],
            ["Professional", "Side Part · Comb Over Fade · Hard Part · Undercut"],
            ["Bollywood", "Pompadour · Slick Back · Quiff"],
            ["Streetwear", "Textured Crop · French Crop · Faux Hawk · Spiky Textured"],
            ["Natural", "Wavy Fringe · Bro Flow · Modern Mullet"],
          ] as const).map(([cat, styles]) => (
            <div key={cat} style={{ background: "#15121f", border: "1px solid #2a2540", borderRadius: 12, padding: "10px 16px", fontSize: 13 }}>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: ".04em" }}>{cat}</span>
              <div style={{ color: "#9b94b8", marginTop: 4, lineHeight: 1.5 }}>{styles}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 14, fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#4a4568" }}>
          25 STYLES TOTAL · ALL RENDERED ON YOUR FACE IN THE APP
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="l-section">
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#a78bfa", letterSpacing: ".08em", textAlign: "center" }}>FAQ</div>
        <h2 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 38, letterSpacing: "-.025em", textAlign: "center", margin: "10px 0 0" }}>Common questions.</h2>
        <div style={{ maxWidth: 680, margin: "36px auto 0", display: "flex", flexDirection: "column" }}>
          {([
            ["How realistic are the results?",
             "Very. We use GPT-Image-2 — the same generation model behind the best AI tools in the world. The output is a photorealistic image of you with the new hairstyle, not a cartoon or overlay. Results vary slightly with photo quality, which is why the app guides you on how to take good shots."],
            ["What photos do I need?",
             "Three photos: front-facing, left profile, and right profile. The app shows you exactly how to frame each one. Plain backgrounds and natural daylight give the best results. The whole photo process takes under 2 minutes."],
            ["How long does a session take?",
             "About 60–90 seconds after you upload. Claude AI reads your face shape and selects matching styles, then GPT-Image-2 renders each one. You can tap any style to see left and right angle views too."],
            ["How does the barber screen work?",
             "Once you pick a style you like, tap 'Show barber' on the detail screen. It brings up a full-screen, bright, easy-to-read view of the result that you can hold up at the salon. No printing, no screenshots, no explaining — your barber sees exactly what you want."],
            ["Does it work for thick South Asian hair?",
             "Yes — that's exactly who this is built for. Most style apps and inspiration content is optimised for fine Western hair textures. Our prompts and style catalog are specifically tuned for thick, dark, South Asian hair. If a style doesn't suit your texture, we surface that via the face-shape filter."],
            ["Will my photos be shared or used for advertising?",
             "No. Your photos are stored privately in your account and are never shared or used for advertising. You can delete them at any time from your profile settings."],
          ] as const).map(([q, a]) => (
            <details key={q} style={{ borderBottom: "1px solid #1e1a2e", padding: "18px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 16, color: "#f4f2fb", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                {q}
                <span style={{ color: "#6b6485", fontSize: 20, flexShrink: 0, lineHeight: 1 }}>+</span>
              </summary>
              <p style={{ fontSize: 14, color: "#9b94b8", marginTop: 12, lineHeight: 1.65, marginBottom: 0 }}>{a}</p>
            </details>
          ))}

          {/* Payment FAQ — needs an inline link */}
          <details style={{ borderBottom: "1px solid #1e1a2e", padding: "18px 0" }}>
            <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 16, color: "#f4f2fb", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              How do I pay? I don&apos;t have a card.
              <span style={{ color: "#6b6485", fontSize: 20, flexShrink: 0, lineHeight: 1 }}>+</span>
            </summary>
            <p style={{ fontSize: 14, color: "#9b94b8", marginTop: 12, lineHeight: 1.65, marginBottom: 0 }}>
              No card needed. Your first session is completely free. For additional sessions, we accept <strong style={{ color: "#cdc6e3" }}>FonePay, eSewa, and cash</strong>.{" "}
              <a
                href="https://wa.me/9779849696795?text=Hi%2C%20I%27d%20like%20to%20buy%20a%20Banlah%20session%20credit"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#a78bfa", textDecoration: "underline" }}
              >
                Message us on WhatsApp
              </a>{" "}
              and we&apos;ll activate your credits within an hour.
            </p>
          </details>
        </div>
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
              <div>✓ 4 styles on your face</div>
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

      {/* Banlah meaning */}
      <section style={{ textAlign: "center", padding: "52px 24px", borderTop: "1px solid #1c172b" }}>
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#6b6485", letterSpacing: ".1em" }}>THE NAME</div>
        <div style={{ marginTop: 14, display: "inline-flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(38px,8vw,60px)", letterSpacing: "-.03em", lineHeight: 1 }}>Banlah</span>
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "clamp(22px,5vw,36px)", color: "#6b6485", letterSpacing: "-.01em" }}>बांलाः</span>
        </div>
        <p style={{ fontSize: 16, color: "#9b94b8", margin: "18px auto 0", lineHeight: 1.7, maxWidth: 480 }}>
          The Newari word your boys say when the cut works. We named the app after it.
        </p>
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
          <Image src="/icon.png" alt="Banlah" width={22} height={22} style={{ borderRadius: 7, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: "#cdc6e3" }}>Banlah</span>
          <span>· Made in Kathmandu</span>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <a href="#" style={{ color: "#6b6485", textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ color: "#6b6485", textDecoration: "none" }}>Terms</a>
          <a
            href="https://wa.me/9779849696795?text=Hi%2C%20I%20have%20a%20question%20about%20Banlah"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#6b6485", textDecoration: "none" }}
          >Contact</a>
        </div>
      </footer>
    </div>
  );
}
