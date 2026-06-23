"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { STYLES } from "@/lib/styles-data";

const STEPS_INITIAL = [
  { label: "Face shape detected",   done: false,   active: false },
  { label: "Matching 10 styles…",   done: false,   active: false },
  { label: "Rendering previews",    done: false,   active: false },
];

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";

export default function AnalyzingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [steps, setSteps] = useState(STEPS_INITIAL);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    if (SANDBOX || id === "demo") {
      // Sandbox: mock progress then redirect
      setSteps(s => s.map((st, i) => i === 0 ? { ...st, active: true } : st));
      const t1 = setTimeout(() => setSteps(s => s.map((st, i) =>
        i === 0 ? { ...st, done: true, active: false } :
        i === 1 ? { ...st, active: true } : st
      )), 1200);
      const t2 = setTimeout(() => setSteps(s => s.map((st, i) =>
        i === 1 ? { ...st, done: true, active: false } :
        i === 2 ? { ...st, active: true } : st
      )), 2800);
      const t3 = setTimeout(() => router.replace(`/session/${id}`), 4000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    // Production: consume SSE from the process route
    let cancelled = false;
    let stylesCount = 0;
    const dec = new TextDecoder();

    const start = async () => {
      let res: Response;
      try {
        res = await fetch(`/api/sessions/${id}/process`, { method: "POST" });
      } catch {
        router.replace(`/session/${id}`);
        return;
      }
      if (!res.ok || !res.body) {
        router.replace(`/session/${id}`);
        return;
      }

      const reader = res.body.getReader();
      readerRef.current = reader;
      let buf = "";

      try {
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6)) as {
                step: string;
                faceShape?: string;
                styleId?: string;
                imageUrl?: string | null;
              };

              switch (evt.step) {
                case "analyzing":
                  setSteps(s => s.map((st, i) => i === 0 ? { ...st, active: true } : st));
                  break;
                case "face_done":
                  setSteps(s => s.map((st, i) =>
                    i === 0 ? { ...st, done: true, active: false } :
                    i === 1 ? { ...st, active: true } : st
                  ));
                  break;
                case "generating":
                  setSteps(s => s.map((st, i) => i === 2 ? { ...st, active: true } : st));
                  break;
                case "style_done":
                case "style_failed":
                  stylesCount++;
                  setSteps(s => s.map((st, i) =>
                    i === 1 ? { ...st, label: `Matching styles… (${stylesCount}/${STYLES.length})` } : st
                  ));
                  break;
                case "complete":
                  setSteps(s => s.map(st => ({ ...st, done: true, active: false })));
                  setTimeout(() => router.replace(`/session/${id}`), 600);
                  break;
                case "error":
                  router.replace(`/session/${id}`);
                  break;
              }
            } catch { /* malformed line */ }
          }
        }
      } catch {
        // stream cancelled or network error
        if (!cancelled) router.replace(`/session/${id}`);
      }
    };

    start();
    return () => {
      cancelled = true;
      readerRef.current?.cancel();
    };
  }, [id, router]);

  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "radial-gradient(110% 70% at 50% 35%, #1b1230 0%, #0f0d17 60%)", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 26, textAlign: "center" }}>

      <style>{`
        @keyframes hsSpin  { to { transform: rotate(360deg); } }
        @keyframes hsPulse { 0%,100% { opacity:.35 } 50% { opacity:1 } }
        @keyframes hsScan  { 0% { transform:translateY(-110%) } 100% { transform:translateY(110%) } }
        @keyframes hsBar   { 0% { width:8% } 100% { width:92% } }
      `}</style>

      {/* Spinner + face */}
      <div style={{ position: "relative", width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #2a2540", borderTopColor: "#a78bfa", animation: "hsSpin 1.1s linear infinite" }} />
        <div style={{ width: 108, height: 108, borderRadius: "50%", overflow: "hidden", background: "repeating-linear-gradient(135deg,#2a2240,#2a2240 8px,#332a4d 8px,#332a4d 16px)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.4)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, height: 36, background: "linear-gradient(transparent,rgba(167,139,250,.55),transparent)", animation: "hsScan 1.8s ease-in-out infinite" }} />
        </div>
      </div>

      <h1 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 25, letterSpacing: "-.02em", marginTop: 30 }}>Reading your face…</h1>
      <p style={{ fontSize: 13, color: "#9b94b8", marginTop: 8, maxWidth: 250, lineHeight: 1.45 }}>
        Hang tight — we&apos;re matching styles to your face shape and rendering 10 looks.
      </p>

      {/* Progress bar */}
      <div style={{ width: 230, height: 5, borderRadius: 3, background: "#211d33", marginTop: 24, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,#a78bfa,#7c3aed)", borderRadius: 3, animation: "hsBar 3.5s ease-out infinite alternate" }} />
      </div>

      {/* Steps */}
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 11, alignItems: "flex-start", fontSize: 13 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", color: step.done || step.active ? (step.done ? "#f4f2fb" : "#cdc6e3") : "#6b6485" }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
              background: step.done ? "rgba(5,150,105,.18)" : "transparent",
              color: step.done ? "#34d399" : "transparent",
              border: step.done ? "none" : step.active ? "2px solid #a78bfa" : "2px solid #3a3358",
              animation: step.active ? "hsPulse 1.2s ease-in-out infinite" : "none",
            }}>
              {step.done ? "✓" : ""}
            </span>
            {step.label}
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#6b6485", marginTop: 26, letterSpacing: ".05em" }}>
        USUALLY ~60 SECONDS
      </div>

    </div>
    </AppShell>
  );
}
