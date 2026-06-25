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
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 17, letterSpacing: "-.02em" }}>HairStyle AI</div>
          {(SANDBOX || !HAS_SUPABASE) && (
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#a78bfa", background: "rgba(124,58,237,.15)", padding: "2px 7px", borderRadius: 5 }}>SANDBOX</span>
          )}
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
            {/* Headline — pushed to bottom with margin-top:auto */}
            <div style={{ marginTop: "auto" }}>
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
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "conic-gradient(#ea4335 0deg 90deg,#fbbc05 90deg 180deg,#34a853 180deg 270deg,#4285f4 270deg 360deg)", display: "inline-block", flexShrink: 0 }} />
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
