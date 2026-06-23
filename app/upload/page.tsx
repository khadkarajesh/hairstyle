"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

const SLOTS = [
  { id: "front", label: "Front",         hint: "TAP TO CAPTURE" },
  { id: "left",  label: "Left profile",  hint: "TAP TO CAPTURE" },
  { id: "right", label: "Right profile", hint: "TAP TO CAPTURE" },
] as const;

type SlotId = (typeof SLOTS)[number]["id"];

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FREE_LIMIT = 3;

export default function UploadPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Partial<Record<SlotId, File>>>({});
  const [uploading, setUploading] = useState(false);
  const [sessionsUsed, setSessionsUsed] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<SlotId>("front");

  const filledCount = Object.keys(photos).length;
  const atLimit = sessionsUsed !== null && sessionsUsed >= FREE_LIMIT;

  // Fetch how many sessions this user has used
  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE) {
      setSessionsUsed(1); // demo: show 1 of 3 used
      return;
    }
    const fetchCount = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["complete", "generating", "analyzing"]);
      setSessionsUsed(count ?? 0);
    };
    fetchCount();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotos(p => ({ ...p, [activeSlotRef.current]: file }));
    if (e.target) e.target.value = "";
  };

  const openPicker = (slotId: SlotId) => {
    activeSlotRef.current = slotId;
    inputRef.current?.click();
  };

  const handleContinue = async () => {
    if (filledCount < 3 || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("front", photos.front!);
      formData.append("left", photos.left!);
      formData.append("right", photos.right!);
      const res = await fetch("/api/sessions", { method: "POST", body: formData });
      const data = await res.json();
      if (res.status === 402) {
        router.push("/upgrade?reason=limit");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.push(`/session/${data.sessionId}/analyzing`);
    } catch (err) {
      console.error("[upload]", err);
      setUploading(false);
    }
  };

  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 44, flexShrink: 0 }} />

      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 22px 24px", maxWidth: 390, width: "100%", margin: "0 auto" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/guide" style={{ color: "#9b94b8", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>‹ Back</Link>
          <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: atLimit ? "#f87171" : "#a78bfa" }}>
            {sessionsUsed === null
              ? ""
              : atLimit
                ? "FREE LIMIT REACHED"
                : `${FREE_LIMIT - sessionsUsed} FREE SESSION${FREE_LIMIT - sessionsUsed === 1 ? "" : "S"} LEFT`}
          </span>
        </div>

        <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", marginTop: 16 }}>Add your photos</h1>

        {/* Free limit banner */}
        {atLimit && (
          <div style={{ marginTop: 14, borderRadius: 12, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.4 }}>
              You&apos;ve used all 3 free sessions.
            </div>
            <Link href="/upgrade" style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
              UPGRADE →
            </Link>
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 5, borderRadius: 3, background: "#211d33", marginTop: 18, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(filledCount / 3) * 100}%`, background: "linear-gradient(90deg,#a78bfa,#7c3aed)", borderRadius: 3, transition: "width .3s" }} />
        </div>

        {/* Slots */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {SLOTS.map(slot => {
            const photo = photos[slot.id];
            return (
              <div
                key={slot.id}
                onClick={() => !photo && !atLimit && openPicker(slot.id)}
                style={{ display: "flex", gap: 13, alignItems: "center", background: "#15121f", border: `1px ${photo ? "solid #2a2540" : "dashed #3a3358"}`, borderRadius: 15, padding: 11, cursor: photo || atLimit ? "default" : "pointer", opacity: atLimit && !photo ? 0.5 : 1 }}
              >
                <div style={{ width: 64, height: 80, borderRadius: 11, flexShrink: 0, overflow: "hidden", background: photo ? "transparent" : "#1d1930", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {photo
                    ? <img src={URL.createObjectURL(photo)} alt={slot.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ color: "#6b6485", fontSize: 24 }}>＋</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{slot.label}</div>
                  {photo
                    ? <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#34d399", marginTop: 3 }}>✓ ADDED · {photo.name}</div>
                    : <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#9b94b8", marginTop: 3 }}>{slot.hint}</div>
                  }
                </div>
                {photo && (
                  <button
                    onClick={e => { e.stopPropagation(); openPicker(slot.id); }}
                    style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Retake
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Privacy note */}
        <p style={{ fontSize: 11, color: "#6b6485", textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
          Photos are processed securely and not stored beyond your session.
        </p>

        {/* Buttons */}
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 11 }}>
          {atLimit ? (
            <Link
              href="/upgrade"
              style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "none", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}
            >
              Upgrade to continue →
            </Link>
          ) : (
            <>
              <button
                onClick={() => openPicker("front")}
                style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, fontSize: 15, color: "#fff", border: "none", cursor: "pointer", width: "100%", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}
              >
                <span style={{ width: 18, height: 14, border: "2px solid #fff", borderRadius: 4, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", border: "2px solid #fff", display: "block" }} />
                </span>
                Open camera
              </button>
              <button
                onClick={() => { activeSlotRef.current = "front"; inputRef.current?.click(); }}
                style={{ height: 50, borderRadius: 14, background: "#181527", border: "1px solid #2a2540", fontWeight: 600, fontSize: 14, color: "#cdc6e3", cursor: "pointer", width: "100%" }}
              >
                Choose from gallery
              </button>
              {filledCount >= 1 && (
                <button
                  onClick={handleContinue}
                  disabled={uploading}
                  style={{ height: 50, borderRadius: 14, background: "transparent", border: "1px solid #3a3358", fontWeight: 600, fontSize: 14, color: uploading ? "#6b6485" : "#a78bfa", cursor: uploading ? "not-allowed" : "pointer", width: "100%" }}
                >
                  {uploading ? "Uploading…" : filledCount === 3 ? "Analyze my photos →" : `Continue with ${filledCount}/3 →`}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
    </AppShell>
  );
}
