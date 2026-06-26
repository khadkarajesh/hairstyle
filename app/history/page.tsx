"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { stripeBg } from "@/lib/styles-data";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }).toUpperCase();
}

const FREE_LIMIT = 1;

interface SessionRow { id: string; created_at: string; selected_styles: string[] | null; }

export default function HistoryPage() {
  const [sessions, setSessions]         = useState<SessionRow[]>([]);
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [creditsRemaining, setCredits]  = useState<number | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE) { setLoading(false); return; }

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data }, { count }, { data: cr }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("sessions")
          .select("id, created_at, selected_styles")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("credits")
          .select("sessions_remaining")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (data) setSessions(data);
      if (count != null) setSessionsUsed(count);
      if (cr != null) setCredits(cr.sessions_remaining);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <AppShell>
      <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", paddingBottom: 80 }}>
        <div style={{ height: 44 }} />

        <div style={{ maxWidth: 390, margin: "0 auto", padding: "14px 20px 0" }}>

          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 24, letterSpacing: "-.02em" }}>History</div>
          <div style={{ fontSize: 13, color: "#9b94b8", marginTop: 4 }}>All your past sessions</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {loading && [0, 1, 2].map(i => (
              <div key={i} style={{ height: 62, borderRadius: 13, background: "#15121f", border: "1px solid #2a2540", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}

            {!loading && sessions.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✂</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>No sessions yet</div>
                <div style={{ fontSize: 13, color: "#9b94b8", marginTop: 6 }}>Upload 3 photos to get your first AI-generated looks.</div>
                <Link href="/upload" style={{ marginTop: 20, display: "inline-block", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", padding: "13px 26px", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "#fff", textDecoration: "none" }}>
                  Start first session →
                </Link>
              </div>
            )}

            {sessions.map((s, idx) => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "#15121f", border: "1px solid #2a2540", borderRadius: 13, padding: 11, textDecoration: "none", color: "#f4f2fb" }}
              >
                {/* Style preview thumbnails */}
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  {[0, 1].map(i => {
                    const styleId = s.selected_styles?.[i];
                    const hue = styleId
                      ? ((styleId.charCodeAt(0) * 7 + styleId.charCodeAt(1) * 13) % 80 + 260)
                      : 290 + idx * 20;
                    return <div key={i} style={{ width: 30, height: 40, borderRadius: 7, background: stripeBg(hue) }} />;
                  })}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Session {sessions.length - idx}</div>
                  <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#9b94b8", marginTop: 3 }}>
                    {formatDate(s.created_at)} · {s.selected_styles?.length ?? 0} STYLES
                  </div>
                </div>

                <span style={{ color: "#6b6485", fontSize: 16, flexShrink: 0 }}>›</span>
              </Link>
            ))}
          </div>

          {!loading && sessions.length > 0 && (() => {
            const atLimit = sessionsUsed >= FREE_LIMIT && (creditsRemaining === null || creditsRemaining <= 0);
            return atLimit ? (
              <Link href="/upgrade" style={{ marginTop: 16, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", textDecoration: "none", boxShadow: "0 10px 22px -10px rgba(124,58,237,.7)" }}>
                Buy sessions to continue →
              </Link>
            ) : (
              <Link href="/new-session" style={{ marginTop: 16, height: 46, borderRadius: 12, border: "1px solid #2a2540", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, color: "#a78bfa", textDecoration: "none" }}>
                + New session
              </Link>
            );
          })()}

        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
        <BottomNav />
      </div>
    </AppShell>
  );
}
