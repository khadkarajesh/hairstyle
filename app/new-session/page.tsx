"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";

const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
}

export default function NewSessionPage() {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [sourceSessionId, setSourceSessionId]   = useState<string | null>(null);
  const [sourceDate, setSourceDate]             = useState("");
  const [photoUrls, setPhotoUrls]               = useState<Record<string, string>>({});
  const [reference, setReference]               = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [submitting, setSubmitting]             = useState(false);
  const [error, setError]                       = useState("");

  useEffect(() => {
    if (!HAS_SUPABASE) { router.replace("/upload"); return; }

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      // Find most recent completed session with uploaded photos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sessions } = await (supabase as any)
        .from("sessions")
        .select("id, created_at")
        .eq("user_id", user.id)
        .in("status", ["complete", "generating", "analyzing"])
        .order("created_at", { ascending: false })
        .limit(1);

      const prev = sessions?.[0];
      if (!prev) { router.replace("/upload"); return; }

      setSourceSessionId(prev.id);
      setSourceDate(formatDate(prev.created_at));

      // Signed URLs for photo preview (5 min — display only)
      const urls: Record<string, string> = {};
      await Promise.all(["front", "left", "right"].map(async (angle) => {
        const { data } = await supabase.storage
          .from("uploads")
          .createSignedUrl(`${user.id}/${prev.id}/${angle}.jpg`, 300);
        if (data?.signedUrl) urls[angle] = data.signedUrl;
      }));
      setPhotoUrls(urls);
      setLoading(false);
    };

    load();
  }, [router]);

  const pickReference = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReference(file);
    setReferencePreview(URL.createObjectURL(file));
    if (e.target) e.target.value = "";
  };

  const removeReference = () => {
    setReference(null);
    if (referencePreview) { URL.revokeObjectURL(referencePreview); setReferencePreview(null); }
  };

  const handleAnalyze = async () => {
    if (!sourceSessionId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("reuse_session_id", sourceSessionId);
      if (reference) formData.append("reference", reference);

      const res  = await fetch("/api/sessions", { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 402) { router.push("/upgrade?reason=limit"); return; }
      if (!res.ok) throw new Error(data.error ?? "Failed to start session");

      router.push(`/session/${data.sessionId}/analyzing`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", paddingBottom: 80 }}>
        <div style={{ height: 44 }} />

        <div style={{ maxWidth: 390, margin: "0 auto", padding: "14px 20px 0" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Link href="/history" style={{ color: "#9b94b8", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>‹ Back</Link>
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: ".04em" }}>NEW SESSION</span>
          </div>

          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 26, letterSpacing: "-.02em", lineHeight: 1.1 }}>
            Ready for a new look?
          </div>
          <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 8, lineHeight: 1.5 }}>
            We&apos;re using your photos from last time. Just tap Analyze — or add a style reference first.
          </p>

          {/* Previous photos preview */}
          <div style={{ marginTop: 22, background: "#15121f", border: "1px solid #2a2540", borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#6b6485", letterSpacing: ".05em" }}>YOUR PHOTOS</div>
                {!loading && <div style={{ fontSize: 12, color: "#9b94b8", marginTop: 2 }}>From {sourceDate}</div>}
              </div>
              <Link href="/upload" style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", textDecoration: "none", letterSpacing: ".04em" }}>
                RETAKE →
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {["front", "left", "right"].map(angle => (
                <div key={angle} style={{ aspectRatio: "3/4", borderRadius: 10, overflow: "hidden", background: "#1d1930", position: "relative" }}>
                  {loading ? (
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,#1d1930,#1d1930 8px,#221d35 8px,#221d35 16px)", animation: "pulse 1.5s ease-in-out infinite" }} />
                  ) : photoUrls[angle] ? (
                    <img src={photoUrls[angle]} alt={angle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "#4a4568" }}>{angle.toUpperCase()}</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-space-mono)", fontSize: 7, color: "rgba(255,255,255,.4)", letterSpacing: ".04em" }}>
                    {angle.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional reference photo */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: ".06em" }}>STYLE REFERENCE</div>
              <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#4a4568", background: "#1c172b", border: "1px solid #2a2540", padding: "2px 7px", borderRadius: 5 }}>OPTIONAL</div>
            </div>

            <div
              onClick={() => !reference && pickReference()}
              style={{ display: "flex", gap: 13, alignItems: "center", background: "#15121f", border: `1px dashed ${reference ? "#3a3358" : "#3a2f5a"}`, borderRadius: 15, padding: 11, cursor: reference ? "default" : "pointer" }}
            >
              <div style={{ width: 64, height: 80, borderRadius: 11, flexShrink: 0, overflow: "hidden", background: "#1a1230", position: "relative" }}>
                {referencePreview
                  ? <img src={referencePreview} alt="reference" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <span style={{ fontSize: 22 }}>⭐</span>
                      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 7, color: "#4a3a70", letterSpacing: ".03em" }}>ADD PHOTO</span>
                    </div>
                  )
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Celebrity / influencer</div>
                {reference
                  ? <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#34d399", marginTop: 3 }}>✓ REFERENCE ADDED</div>
                  : <div style={{ fontSize: 11, color: "#6b6485", marginTop: 3, lineHeight: 1.55 }}>K-pop idol, actor, or anyone whose hairstyle you want. AI will weight recommendations toward that look.</div>
                }
              </div>
              {reference && (
                <button
                  onClick={e => { e.stopPropagation(); removeReference(); }}
                  style={{ fontSize: 12, color: "#f87171", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#f87171", textAlign: "center" }}>{error}</div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={submitting || loading}
            style={{ marginTop: 24, width: "100%", height: 52, borderRadius: 14, background: (submitting || loading) ? "#1d1930" : "linear-gradient(135deg,#8b5cf6,#7c3aed)", border: "none", fontWeight: 700, fontSize: 16, color: (submitting || loading) ? "#6b6485" : "#fff", cursor: (submitting || loading) ? "not-allowed" : "pointer", boxShadow: (submitting || loading) ? "none" : "0 12px 26px -10px rgba(124,58,237,.8)" }}
          >
            {submitting ? "Starting…" : "Analyze my look →"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#4a4568", marginTop: 12, lineHeight: 1.5 }}>
            Results in ~60 seconds
          </p>

        </div>

        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ position: "fixed", top: "-200%", left: "-200%", opacity: 0, pointerEvents: "none" }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
        <BottomNav />
      </div>
    </AppShell>
  );
}
