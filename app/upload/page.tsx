"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotId = "front" | "left" | "right";
type Step =
  | "intro"
  | "front" | "front-confirm"
  | "left"  | "left-confirm"
  | "right" | "right-confirm"
  | "review";

const STEP_SEQUENCE: Step[] = [
  "intro",
  "front", "front-confirm",
  "left",  "left-confirm",
  "right", "right-confirm",
  "review",
];

function slotForStep(step: Step): SlotId | null {
  if (step === "intro" || step === "review") return null;
  return step.replace("-confirm", "") as SlotId;
}

function nextStep(step: Step): Step {
  const i = STEP_SEQUENCE.indexOf(step);
  return STEP_SEQUENCE[Math.min(i + 1, STEP_SEQUENCE.length - 1)];
}

// ─── Slot metadata ────────────────────────────────────────────────────────────

const SLOT_META = {
  front: {
    label: "Front",
    stepLabel: "FRONT VIEW",
    title: "Face the camera",
    hint: "Chin level · fill the frame · shoulders visible",
    cameraHint: "FACE FORWARD · SHOULDERS IN FRAME",
    checks: ["Face fills the frame", "Chin level, not tilted", "Good, even lighting"],
  },
  left: {
    label: "Left profile",
    stepLabel: "LEFT PROFILE",
    title: "Turn your head left",
    hint: "Full profile · ear clearly visible · shoulders visible",
    cameraHint: "TURN HEAD LEFT · EAR VISIBLE",
    checks: ["Full profile visible", "Ear clearly visible", "Good, even lighting"],
  },
  right: {
    label: "Right profile",
    stepLabel: "RIGHT PROFILE",
    title: "Turn your head right",
    hint: "Full profile · ear clearly visible · shoulders visible",
    cameraHint: "TURN HEAD RIGHT · EAR VISIBLE",
    checks: ["Full profile visible", "Ear clearly visible", "Good, even lighting"],
  },
} as const;

// ─── Constants ────────────────────────────────────────────────────────────────

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FREE_LIMIT = 1;
const TIP_KEY = "hs_photo_tip_v1";

// ─── Pose SVGs ────────────────────────────────────────────────────────────────

function FrontPose({ size = 130 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 124" width={size} height={Math.round(size * 1.24)}>
      {/* Guide oval */}
      <ellipse cx="50" cy="52" rx="38" ry="48" fill="rgba(124,58,237,.08)" stroke="#3a3358" strokeWidth="1.2" strokeDasharray="4 2"/>
      {/* Head */}
      <ellipse cx="50" cy="46" rx="22" ry="27" fill="#2a2445"/>
      {/* Eyes */}
      <circle cx="42" cy="43" r="2.4" fill="#6d28d9" opacity="0.9"/>
      <circle cx="58" cy="43" r="2.4" fill="#6d28d9" opacity="0.9"/>
      {/* Nose bridge */}
      <path d="M50 46 L48 54 Q50 57 52 54 L50 46" fill="#1e1a3a"/>
      {/* Mouth */}
      <path d="M44 62 Q50 66 56 62" fill="none" stroke="#3a3060" strokeWidth="1.4" strokeLinecap="round"/>
      {/* Neck */}
      <rect x="43" y="71" width="14" height="11" rx="6" fill="#2a2445"/>
      {/* Shoulders */}
      <path d="M12 110 Q50 96 88 110" fill="none" stroke="#2a2445" strokeWidth="5" strokeLinecap="round"/>
      {/* Crosshair */}
      <line x1="50" y1="10" x2="50" y2="76" stroke="#3a3060" strokeWidth="0.7" opacity="0.4"/>
      <line x1="18" y1="46" x2="82" y2="46" stroke="#3a3060" strokeWidth="0.7" opacity="0.4"/>
      {/* Center dot */}
      <circle cx="50" cy="46" r="2" fill="#7c3aed" opacity="0.7"/>
    </svg>
  );
}

function LeftPose({ size = 130 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 124" width={size} height={Math.round(size * 1.24)}>
      {/* Guide oval */}
      <ellipse cx="50" cy="52" rx="38" ry="48" fill="rgba(124,58,237,.08)" stroke="#3a3358" strokeWidth="1.2" strokeDasharray="4 2"/>
      {/* Head profile shape (facing left) */}
      <path d="M60 22 Q78 26 80 46 Q82 66 66 74 Q58 78 52 74 L52 22 Z" fill="#2a2445"/>
      <ellipse cx="54" cy="48" rx="8" ry="27" fill="#2a2445"/>
      {/* Nose bump */}
      <path d="M52 40 Q42 48 46 57" fill="none" stroke="#4a3a70" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Chin */}
      <path d="M47 68 Q44 72 48 75" fill="none" stroke="#3a3060" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Ear (visible on right) */}
      <ellipse cx="77" cy="48" rx="4" ry="7" fill="#3a3060" stroke="#5a4b80" strokeWidth="1.2"/>
      <path d="M74 44 Q76 48 74 52" fill="none" stroke="#4a3870" strokeWidth="1" strokeLinecap="round"/>
      {/* Neck */}
      <rect x="50" y="72" width="12" height="10" rx="4" fill="#2a2445"/>
      {/* Shoulders */}
      <path d="M14 110 Q50 96 86 110" fill="none" stroke="#2a2445" strokeWidth="5" strokeLinecap="round"/>
      {/* Direction arrow */}
      <path d="M26 48 L36 48" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 48 L31 44" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 48 L31 52" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function RightPose({ size = 130 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 124" width={size} height={Math.round(size * 1.24)}>
      {/* Guide oval */}
      <ellipse cx="50" cy="52" rx="38" ry="48" fill="rgba(124,58,237,.08)" stroke="#3a3358" strokeWidth="1.2" strokeDasharray="4 2"/>
      {/* Head profile shape (facing right) */}
      <path d="M40 22 Q22 26 20 46 Q18 66 34 74 Q42 78 48 74 L48 22 Z" fill="#2a2445"/>
      <ellipse cx="46" cy="48" rx="8" ry="27" fill="#2a2445"/>
      {/* Nose bump */}
      <path d="M48 40 Q58 48 54 57" fill="none" stroke="#4a3a70" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Chin */}
      <path d="M53 68 Q56 72 52 75" fill="none" stroke="#3a3060" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Ear (visible on left) */}
      <ellipse cx="23" cy="48" rx="4" ry="7" fill="#3a3060" stroke="#5a4b80" strokeWidth="1.2"/>
      <path d="M26 44 Q24 48 26 52" fill="none" stroke="#4a3870" strokeWidth="1" strokeLinecap="round"/>
      {/* Neck */}
      <rect x="38" y="72" width="12" height="10" rx="4" fill="#2a2445"/>
      {/* Shoulders */}
      <path d="M14 110 Q50 96 86 110" fill="none" stroke="#2a2445" strokeWidth="5" strokeLinecap="round"/>
      {/* Direction arrow */}
      <path d="M74 48 L64 48" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
      <path d="M74 48 L69 44" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
      <path d="M74 48 L69 52" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function PoseSVG({ slot, size }: { slot: SlotId; size?: number }) {
  if (slot === "front") return <FrontPose size={size} />;
  if (slot === "left") return <LeftPose size={size} />;
  return <RightPose size={size} />;
}

// ─── Camera modal ─────────────────────────────────────────────────────────────

function CameraModal({
  slotLabel,
  cameraHint,
  onCapture,
  onClose,
}: {
  slotLabel: string;
  cameraHint: string;
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
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

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // Always crop to portrait 3:4 from the center of the frame.
    // Landscape webcam streams (1280×960, 1280×720) would otherwise produce
    // wide images that confuse the AI model and create misaligned comparisons.
    const sw = vw / vh > 3 / 4 ? Math.round(vh * 3 / 4) : vw;
    const sx = Math.round((vw - sw) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, 0, sw, vh, 0, 0, sw, vh);
    canvas.toBlob(blob => {
      if (blob) onCapture(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
      stop();
      onClose();
    }, "image/jpeg", 0.92);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 540 }}>
        <video
          ref={videoRef} autoPlay playsInline muted
          style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", transform: "scaleX(-1)", background: "#111", display: "block" }}
        />
        {/* Portrait crop overlay — darkens the landscape edges that will be cropped */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 100 75" preserveAspectRatio="xMidYMid meet"
        >
          {/* Dark side panels — only the center 56.25% (3:4 of frame height) is captured */}
          <rect x="0"      y="0" width="21.875" height="75" fill="rgba(0,0,0,.55)"/>
          <rect x="78.125" y="0" width="21.875" height="75" fill="rgba(0,0,0,.55)"/>
          {/* Portrait crop border */}
          <rect x="21.875" y="0.5" width="56.25" height="74" fill="none" stroke="rgba(167,139,250,.55)" strokeWidth="0.5"/>
          {/* Face oval inside portrait zone */}
          <ellipse cx="50" cy="36" rx="17" ry="24"
            fill="rgba(124,58,237,.07)"
            stroke="rgba(167,139,250,.75)"
            strokeWidth="0.7"
            strokeDasharray="3 2"
          />
        </svg>
        <div style={{ position: "absolute", top: 14, left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-space-mono)", fontSize: 11, color: "rgba(167,139,250,.9)", letterSpacing: ".06em", textShadow: "0 1px 6px rgba(0,0,0,.8)" }}>
          {slotLabel}
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-space-mono)", fontSize: 9, color: "rgba(167,139,250,.8)", letterSpacing: ".04em", textShadow: "0 1px 4px rgba(0,0,0,.8)" }}>
          {cameraHint}
        </div>
        {!ready && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#9b94b8", fontSize: 13, fontFamily: "var(--font-space-mono)" }}>
            STARTING CAMERA…
          </div>
        )}
      </div>
      <div style={{ padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 540 }}>
        <button onClick={() => { stop(); onClose(); }} style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.12)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>✕</button>
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

// ─── Camera icon ──────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="17" height="15" viewBox="0 0 17 15" fill="none">
      <rect x="0.8" y="3.5" width="15.4" height="10.7" rx="2.4" stroke="white" strokeWidth="1.6"/>
      <circle cx="8.5" cy="8.9" r="2.8" stroke="white" strokeWidth="1.6"/>
      <path d="M6 2H11" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Dot progress ─────────────────────────────────────────────────────────────

function DotProgress({ active }: { active: 0 | 1 | 2 }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {([0, 1, 2] as const).map(i => (
        <div
          key={i}
          style={{
            width: i === active ? 20 : 7,
            height: 7,
            borderRadius: 4,
            background: i === active ? "#a78bfa" : i < active ? "#4a3a70" : "#2a2540",
            transition: "all .25s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);
  const [photos, setPhotos] = useState<Partial<Record<SlotId, File>>>({});
  const [uploading, setUploading] = useState(false);
  const [sessionsUsed, setSessionsUsed] = useState<number | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const atLimit =
    sessionsUsed !== null &&
    sessionsUsed >= FREE_LIMIT &&
    (creditsRemaining === null || creditsRemaining <= 0);

  const currentSlot = step ? slotForStep(step) : null;

  // Determine initial step after mount
  useEffect(() => {
    setStep(localStorage.getItem(TIP_KEY) ? "front" : "intro");
  }, []);

  // Auto-advance capture step → confirm if photo already exists (e.g. after review retake)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!step || !["front", "left", "right"].includes(step)) return;
    const slot = step as SlotId;
    if (photos[slot]) setStep(`${slot}-confirm` as Step);
  }, [step]); // intentionally omit photos — only fires on step change

  // Fetch session usage
  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE) { setSessionsUsed(0); return; }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cr } = await (supabase as any)
        .from("credits")
        .select("sessions_remaining")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cr !== null) setCreditsRemaining(cr.sessions_remaining);
    };
    fetchCount();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSlot) return;
    setPhotos(p => ({ ...p, [currentSlot]: file }));
    setStep(s => s ? nextStep(s) : s);
    if (e.target) e.target.value = "";
  };

  const openGallery = () => {
    if (!inputRef.current) return;
    inputRef.current.removeAttribute("capture");
    inputRef.current.click();
  };

  const openCamera = (slot: SlotId) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      if (inputRef.current) {
        inputRef.current.setAttribute("capture", "environment");
        inputRef.current.click();
      }
    } else {
      setCameraOpen(true);
    }
    // ensure currentSlot is correct by reading from step
    void slot;
  };

  const handleCameraCapture = (file: File) => {
    if (!currentSlot) return;
    setPhotos(p => ({ ...p, [currentSlot]: file }));
    setStep(s => s ? nextStep(s) : s);
  };

  const handleRetake = () => {
    if (!step || !currentSlot) return;
    setPhotos(p => { const n = { ...p }; delete n[currentSlot]; return n; });
    const i = STEP_SEQUENCE.indexOf(step);
    setStep(STEP_SEQUENCE[Math.max(0, i - 1)]);
  };

  const handleContinue = async () => {
    if (Object.keys(photos).length < 3 || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("front", photos.front!);
      formData.append("left", photos.left!);
      formData.append("right", photos.right!);
      const res = await fetch("/api/sessions", { method: "POST", body: formData });
      const data = await res.json();
      if (res.status === 402) { router.push("/upgrade?reason=limit"); return; }
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.push(`/session/${data.sessionId}/analyzing`);
    } catch (err) {
      console.error("[upload]", err);
      setUploading(false);
    }
  };

  // Shared layout wrappers
  const page: React.CSSProperties = {
    minHeight: "100dvh",
    background: "#0f0d17",
    color: "#f4f2fb",
    fontFamily: "var(--font-hanken), sans-serif",
    display: "flex",
    flexDirection: "column",
  };
  const inner: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "18px 22px 32px",
    maxWidth: 390,
    width: "100%",
    margin: "0 auto",
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!step) {
    return <AppShell><div style={{ minHeight: "100dvh", background: "#0f0d17" }} /></AppShell>;
  }

  // ── INTRO ────────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <AppShell>
        <div style={page}>
          <div style={{ height: 44, flexShrink: 0 }} />
          <div style={inner}>
            <button onClick={() => router.back()} style={{ color: "#9b94b8", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>‹ Back</button>

            <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 30, letterSpacing: "-.02em", lineHeight: 1.1, marginTop: 20 }}>
              Better photos,<br />better results.
            </h1>
            <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 10, lineHeight: 1.6 }}>
              The AI needs 3 clear angles to generate accurate hairstyle previews. Here&apos;s what each shot should look like.
            </p>

            {/* 3 pose cards */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {(["front", "left", "right"] as SlotId[]).map(slot => (
                <div key={slot} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ background: "#15121f", borderRadius: 14, border: "1px solid #2a2540", padding: "14px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <PoseSVG slot={slot} size={68} />
                    <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "#a78bfa", letterSpacing: ".05em", marginTop: 10 }}>
                      {SLOT_META[slot].stepLabel}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#6b6485", marginTop: 6, lineHeight: 1.4 }}>
                    {slot === "front" ? "Face forward" : slot === "left" ? "Turn left" : "Turn right"}
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 11 }}>
              {[
                "Good, even lighting — no harsh shadows",
                "No glasses, hat, or hood",
                "Hair out of your face",
                "Neutral expression",
              ].map(tip => (
                <div key={tip} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(5,150,105,.16)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {tip}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "auto", paddingTop: 24 }}>
              <button
                onClick={() => { localStorage.setItem(TIP_KEY, "1"); setStep("front"); }}
                style={{ height: 54, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff", border: "none", cursor: "pointer", width: "100%", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}
              >
                Got it — let&apos;s take photos
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── CAPTURE steps ────────────────────────────────────────────────────────────
  if (step === "front" || step === "left" || step === "right") {
    const slot = step;
    const m = SLOT_META[slot];
    const dotIdx = (["front", "left", "right"] as const).indexOf(slot) as 0 | 1 | 2;

    return (
      <AppShell>
        {cameraOpen && (
          <CameraModal
            slotLabel={m.stepLabel}
            cameraHint={m.cameraHint}
            onCapture={file => { handleCameraCapture(file); setCameraOpen(false); }}
            onClose={() => setCameraOpen(false)}
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ position: "fixed", top: "-200%", left: "-200%", opacity: 0, pointerEvents: "none" }}
        />
        <div style={page}>
          <div style={{ height: 44, flexShrink: 0 }} />
          <div style={inner}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => {
                  const i = STEP_SEQUENCE.indexOf(step);
                  if (i <= 1) router.back();
                  else setStep(STEP_SEQUENCE[i - 1]);
                }}
                style={{ color: "#9b94b8", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ‹ Back
              </button>
              <DotProgress active={dotIdx} />
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#6b6485", minWidth: 32, textAlign: "right" }}>{dotIdx + 1} / 3</span>
            </div>

            {/* Label + title */}
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: ".07em", marginTop: 26 }}>{m.stepLabel}</div>
            <h2 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", marginTop: 4, lineHeight: 1.1 }}>{m.title}</h2>
            <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 6, lineHeight: 1.55 }}>{m.hint}</p>

            {/* Illustration */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
              <div style={{ background: "#15121f", borderRadius: 22, border: "1px solid #2a2540", padding: "32px 40px", display: "inline-flex" }}>
                <PoseSVG slot={slot} size={148} />
              </div>
            </div>

            {/* Hint chips */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
              {m.checks.map(c => (
                <span key={c} style={{ fontSize: 10, color: "#6b6485", background: "#15121f", border: "1px solid #2a2540", borderRadius: 20, padding: "4px 11px" }}>{c}</span>
              ))}
            </div>

            {/* Buttons */}
            {atLimit ? (
              <Link href="/upgrade" style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "none", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}>
                Upgrade to continue →
              </Link>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => openCamera(slot)}
                  style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontWeight: 700, fontSize: 15, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}
                >
                  <CameraIcon /> Take photo
                </button>
                <button
                  onClick={openGallery}
                  style={{ height: 46, borderRadius: 13, background: "transparent", border: "1.5px solid #3a3358", fontWeight: 600, fontSize: 14, color: "#9b94b8", cursor: "pointer" }}
                >
                  Choose from gallery
                </button>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // ── CONFIRM steps ────────────────────────────────────────────────────────────
  if (step === "front-confirm" || step === "left-confirm" || step === "right-confirm") {
    const slot = step.replace("-confirm", "") as SlotId;
    const m = SLOT_META[slot];
    const photo = photos[slot];
    const photoUrl = photo ? URL.createObjectURL(photo) : null;
    const dotIdx = (["front", "left", "right"] as const).indexOf(slot) as 0 | 1 | 2;

    return (
      <AppShell>
        <div style={page}>
          <div style={{ height: 44, flexShrink: 0 }} />
          <div style={inner}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: ".06em" }}>CHECK YOUR PHOTO</span>
              <DotProgress active={dotIdx} />
            </div>

            {/* Photo preview */}
            <div style={{ marginTop: 18, borderRadius: 18, overflow: "hidden", background: "#15121f", border: "1px solid #2a2540", position: "relative", aspectRatio: "4/3" }}>
              {photoUrl && (
                <img src={photoUrl} alt="Your photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
              <div style={{ position: "absolute", bottom: 10, left: 12, fontFamily: "var(--font-space-mono)", fontSize: 9, color: "rgba(167,139,250,.9)", background: "rgba(15,13,23,.72)", padding: "4px 10px", borderRadius: 20, letterSpacing: ".05em" }}>
                {m.stepLabel}
              </div>
            </div>

            {/* Checklist */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, color: "#9b94b8", fontWeight: 600, marginBottom: 12 }}>Quick check before continuing:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {m.checks.map(c => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(5,150,105,.16)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => setStep(nextStep(step))}
                style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", border: "none", cursor: "pointer", width: "100%", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)" }}
              >
                Looks good →
              </button>
              <button
                onClick={handleRetake}
                style={{ height: 46, borderRadius: 13, background: "transparent", border: "1.5px solid #3a3358", fontWeight: 600, fontSize: 14, color: "#9b94b8", cursor: "pointer" }}
              >
                Retake
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── REVIEW ───────────────────────────────────────────────────────────────────
  if (step === "review") {
    const allDone = (["front", "left", "right"] as SlotId[]).every(s => !!photos[s]);

    return (
      <AppShell>
        <div style={page}>
          <div style={{ height: 44, flexShrink: 0 }} />
          <div style={inner}>
            <button
              onClick={() => setStep("right-confirm")}
              style={{ color: "#9b94b8", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
            >
              ‹ Back
            </button>

            <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", marginTop: 16 }}>Ready to analyze</h1>
            <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 6 }}>Tap any photo to retake it.</p>

            {/* 3 thumbnails */}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              {(["front", "left", "right"] as SlotId[]).map(slot => {
                const photo = photos[slot];
                const url = photo ? URL.createObjectURL(photo) : null;
                return (
                  <div
                    key={slot}
                    onClick={() => setStep(slot)}
                    style={{ flex: 1, cursor: "pointer" }}
                  >
                    <div style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "3/4", background: "#15121f", border: "1.5px solid #2a2540", position: "relative" }}>
                      {url ? (
                        <img src={url} alt={slot} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a4568", fontSize: 22 }}>+</div>
                      )}
                      {/* Gradient label */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(15,13,23,.88))", padding: "20px 8px 8px", textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "#a78bfa", letterSpacing: ".04em" }}>
                          {SLOT_META[slot].stepLabel.split(" ")[0]}
                        </div>
                      </div>
                      {/* Retake badge */}
                      {url && (
                        <div style={{ position: "absolute", top: 7, right: 7, background: "rgba(15,13,23,.78)", borderRadius: 20, padding: "2px 8px", fontSize: 8, color: "#9b94b8", fontFamily: "var(--font-space-mono)", letterSpacing: ".03em" }}>
                          RETAKE
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: 11, color: "#6b6485", textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
              Photos are stored securely and used only to generate your looks.
            </p>

            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              <button
                onClick={handleContinue}
                disabled={!allDone || uploading}
                style={{ height: 54, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff", border: "none", cursor: !allDone || uploading ? "not-allowed" : "pointer", width: "100%", boxShadow: "0 12px 26px -10px rgba(124,58,237,.8)", opacity: !allDone || uploading ? 0.7 : 1 }}
              >
                {uploading ? "Uploading…" : "Analyze my photos →"}
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return null;
}
