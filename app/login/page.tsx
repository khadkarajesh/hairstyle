"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/upload";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = () =>
    `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;

  const handleGoogle = async () => {
    if (SANDBOX || !HAS_SUPABASE) {
      router.push(next);
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
    // on success the browser navigates away, so no setLoading(false) needed
  };

  const handleEmailAuth = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (SANDBOX || !HAS_SUPABASE) {
      router.push(next);
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: callbackUrl() },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "radial-gradient(120% 80% at 50% -10%, #1b1230 0%, #0f0d17 55%)", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column" }}>


      {/* Status bar placeholder */}
      <div style={{ height: 44, flexShrink: 0 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 26px 34px", maxWidth: 390, width: "100%", margin: "0 auto" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow: "0 6px 16px -4px rgba(124,58,237,.7)" }} />
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 17, letterSpacing: "-.02em" }}>Banlah</div>
          {(SANDBOX || !HAS_SUPABASE) && (
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#a78bfa", background: "rgba(124,58,237,.15)", padding: "2px 7px", borderRadius: 5 }}>SANDBOX</span>
          )}
        </div>

        {/* Social proof strip — fills the dead space above the form */}
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: "📸", text: "Upload 3 photos in under 2 minutes" },
            { icon: "🧠", text: "AI reads your face shape & picks matching styles" },
            { icon: "✂", text: "Show the result to your barber — no printing" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,.12)", border: "1px solid #2a2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
              <span style={{ fontSize: 13, color: "#cdc6e3", lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>

        {sent ? (
          /* ── Magic link sent state ── */
          <div style={{ marginTop: "auto", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, letterSpacing: "-.025em", lineHeight: 1.1, margin: "0 0 12px" }}>
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: "#9b94b8", lineHeight: 1.5, maxWidth: 260, margin: "0 auto" }}>
              We sent a magic link to <strong style={{ color: "#cdc6e3" }}>{email}</strong>. Tap it to sign in.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{ marginTop: 28, fontSize: 13, color: "#a78bfa", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* Headline */}
            <div style={{ marginTop: 28 }}>
              <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#a78bfa", letterSpacing: ".06em" }}>60-SECOND SIGNUP</div>
              <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 34, letterSpacing: "-.025em", lineHeight: 1.02, margin: "12px 0 0" }}>
                See it before<br />you cut it.
              </h1>
              <p style={{ fontSize: 14, color: "#9b94b8", marginTop: 12, lineHeight: 1.45 }}>
                Upload 3 photos, get 10 AI hairstyle previews on your actual face.
              </p>
            </div>

            {/* Auth options */}
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 11 }}>
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                style={{ height: 50, borderRadius: 13, background: "#ffffff", color: "#1c172b", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer", width: "100%", opacity: loading ? 0.7 : 1 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {loading ? "Redirecting…" : "Continue with Google"}
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#6b6485", fontSize: 12, margin: "2px 0" }}>
                <span style={{ flex: 1, height: 1, background: "#2a2540" }} />
                or
                <span style={{ flex: 1, height: 1, background: "#2a2540" }} />
              </div>

              {/* Email input */}
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                style={{ height: 50, borderRadius: 13, background: "#181527", border: "1px solid #2a2540", padding: "0 16px", color: "#f4f2fb", fontSize: 14, outline: "none", width: "100%" }}
              />

              {error && (
                <div style={{ fontSize: 12, color: "#f87171", textAlign: "center", marginTop: -4 }}>{error}</div>
              )}

              {/* Create account */}
              <button
                onClick={handleEmailAuth}
                disabled={loading || !email.trim()}
                style={{ height: 50, borderRadius: 13, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", border: "none", cursor: (loading || !email.trim()) ? "not-allowed" : "pointer", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)", width: "100%", opacity: (loading || !email.trim()) ? 0.7 : 1 }}
              >
                {loading ? "Sending link…" : "Continue with email"}
              </button>

              <div style={{ textAlign: "center", fontSize: 12, color: "#6b6485", marginTop: 6 }}>
                New or returning — we&apos;ll handle it automatically.
              </div>
            </div>
          </>
        )}

      </div>
    </div>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
