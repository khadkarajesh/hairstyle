"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

const SLOTS = [
  { id: "front", label: "Front",         hint: "Face camera · level chin · neutral expression" },
  { id: "left",  label: "Left side",     hint: "Turn head left · full profile · ear visible"   },
  { id: "right", label: "Right side",    hint: "Turn head right · full profile · ear visible"  },
] as const;

type SlotId = (typeof SLOTS)[number]["id"];

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FREE_LIMIT = 1;

function CameraModal({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => onClose());
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) onCapture(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
      stop();
      onClose();
    }, "image/jpeg", 0.92);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", maxWidth: 540, aspectRatio: "4/3", objectFit: "cover", transform: "scaleX(-1)", background: "#111" }} />
      {!ready && (
        <div style={{ position: "absolute", color: "#9b94b8", fontSize: 13, fontFamily: "var(--font-space-mono)" }}>STARTING CAMERA…</div>
      )}
      <div style={{ padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 540 }}>
        <button
          onClick={() => { stop(); onClose(); }}
          style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.12)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}
        >✕</button>
        <button
          onClick={capture}
          disabled={!ready}
          style={{ width: 68, height: 68, borderRadius: "50%", background: ready ? "#fff" : "#444", border: "5px solid rgba(255,255,255,.25)", cursor: ready ? "pointer" : "not-allowed", flexShrink: 0 }}
        />
        <div style={{ width: 46 }} />
      </div>
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Partial<Record<SlotId, File>>>({});
  const [uploading, setUploading] = useState(false);
  const [sessionsUsed, setSessionsUsed] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"camera" | "gallery">("gallery");
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<SlotId>("front");

  const filledCount = Object.keys(photos).length;
  const atLimit = sessionsUsed !== null && sessionsUsed >= FREE_LIMIT;

  // Fetch how many sessions this user has used
  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE) {
      setSessionsUsed(0); // demo: show 0 of 1 used
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
    if (inputRef.current) {
      inputRef.current.removeAttribute("capture");
      inputRef.current.click();
    }
  };

  const openCamera = (slotId: SlotId) => {
    activeSlotRef.current = slotId;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      if (inputRef.current) {
        inputRef.current.setAttribute("capture", "environment");
        inputRef.current.click();
      }
    } else {
      setCameraOpen(true);
    }
  };

  const handleCameraCapture = (file: File) => {
    setPhotos(p => ({ ...p, [activeSlotRef.current]: file }));
  };

  const openSlot = (slotId: SlotId) => {
    if (inputMode === "camera") openCamera(slotId);
    else openPicker(slotId);
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
    {cameraOpen && (
      <CameraModal
        onCapture={handleCameraCapture}
        onClose={() => setCameraOpen(false)}
      />
    )}
    <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 44, flexShrink: 0 }} />

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ position: "fixed", top: "-200%", left: "-200%", opacity: 0, pointerEvents: "none" }} />

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
        <p style={{ fontSize: 12, color: "#9b94b8", marginTop: 6, lineHeight: 1.5 }}>
          3 angles · good lighting · no hat or glasses
        </p>

        {/* Free limit banner */}
        {atLimit && (
          <div style={{ marginTop: 14, borderRadius: 12, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.4 }}>
              You&apos;ve used your free session.
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
                onClick={() => !photo && !atLimit && openSlot(slot.id)}
                style={{ display: "flex", gap: 13, alignItems: "center", background: "#15121f", border: `1px ${photo ? "solid #2a2540" : "dashed #3a3358"}`, borderRadius: 15, padding: 11, cursor: photo || atLimit ? "default" : "pointer", opacity: atLimit && !photo ? 0.5 : 1 }}
              >
                <div style={{ width: 64, height: 80, borderRadius: 11, flexShrink: 0, overflow: "hidden", background: photo ? "transparent" : "#1d1930", position: "relative" }}>
                  {photo
                    ? <img src={URL.createObjectURL(photo)} alt={slot.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (
                      <svg viewBox="0 0 64 80" width="64" height="80" style={{ display: "block" }}>
                        {/* Face oval guide */}
                        <ellipse cx="32" cy="36" rx="20" ry="26"
                          fill="rgba(124,58,237,.09)"
                          stroke="#5a4b80"
                          strokeWidth="1.5"
                          strokeDasharray="4 2.5"
                        />
                        {/* Subtle crosshair */}
                        <line x1="32" y1="13" x2="32" y2="59" stroke="#3a3360" strokeWidth="0.8"/>
                        <line x1="13" y1="36" x2="51" y2="36" stroke="#3a3360" strokeWidth="0.8"/>
                        {/* Tap plus icon */}
                        <text x="32" y="75" textAnchor="middle" fill="#5a4b80" fontSize="10" fontFamily="sans-serif">tap</text>
                      </svg>
                    )
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{slot.label}</div>
                  {photo
                    ? <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#34d399", marginTop: 3 }}>✓ ADDED · {photo.name}</div>
                    : <div style={{ fontSize: 11, color: "#6b6485", marginTop: 3, lineHeight: 1.5 }}>{slot.hint}</div>
                  }
                </div>
                {photo && (
                  <button
                    onClick={e => { e.stopPropagation(); openSlot(slot.id); }}
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
                onClick={() => { setInputMode("camera"); openCamera("front"); }}
                style={{ height: 52, borderRadius: 14, background: inputMode === "camera" ? "linear-gradient(135deg,#8b5cf6,#7c3aed)" : "linear-gradient(135deg,#6d28d9,#5b21b6)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, fontSize: 15, color: "#fff", border: inputMode === "camera" ? "none" : "2px solid #7c3aed", cursor: "pointer", width: "100%", boxShadow: inputMode === "camera" ? "0 12px 26px -10px rgba(124,58,237,.8)" : "none" }}
              >
                <span style={{ width: 18, height: 14, border: "2px solid #fff", borderRadius: 4, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", border: "2px solid #fff", display: "block" }} />
                </span>
                Open camera {inputMode === "camera" && "✓"}
              </button>
              <button
                onClick={() => { setInputMode("gallery"); openPicker("front"); }}
                style={{ height: 50, borderRadius: 14, background: "#181527", border: inputMode === "gallery" ? "2px solid #7c3aed" : "1px solid #2a2540", fontWeight: 600, fontSize: 14, color: inputMode === "gallery" ? "#cdbfff" : "#cdc6e3", cursor: "pointer", width: "100%" }}
              >
                Choose from gallery {inputMode === "gallery" && "✓"}
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
