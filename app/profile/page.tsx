"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/client";
import { stripeBg } from "@/lib/styles-data";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SESSION_LIMIT = 1; // free tier

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }).toUpperCase();
}

interface SessionRow { id: string; created_at: string; selected_styles: string[] | null; }
interface SavedLook { session_id: string; style_id: string; image_url: string | null; }

export default function ProfilePage() {
  const [name, setName]           = useState("Your Profile");
  const [email, setEmail]         = useState("");
  const [initial, setInitial]     = useState("?");
  const [sessions, setSessions]   = useState<SessionRow[]>([]);
  const [savedLooks, setSaved]    = useState<SavedLook[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (SANDBOX || !HAS_SUPABASE) { setLoading(false); return; }

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "You";
      setName(displayName);
      setEmail(user.email ?? "");
      setInitial((displayName[0] ?? "?").toUpperCase());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sessionRows } = await (supabase as any)
        .from("sessions")
        .select("id, created_at, selected_styles")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (sessionRows) setSessions(sessionRows);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: saved } = await (supabase as any)
        .from("session_styles")
        .select("session_id, style_id, image_url")
        .eq("saved", true)
        .limit(6);
      if (saved) setSaved(saved);

      setLoading(false);
    };

    load();
  }, []);

  const sessionsUsed = sessions.length;
  const usagePct = Math.min(100, Math.round((sessionsUsed / SESSION_LIMIT) * 100));

  return (
    <AppShell>
    <div style={{ minHeight: "100dvh", background: "#0f0d17", color: "#f4f2fb", fontFamily: "var(--font-hanken), sans-serif", paddingBottom: 80 }}>
      <div style={{ height: 44 }} />

      <div style={{ maxWidth: 390, margin: "0 auto", padding: "14px 20px 0" }}>

        {/* Avatar row */}
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 20, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontSize: 12, color: "#9b94b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#cdbfff", background: "#221c33", border: "1px solid #3a3358", padding: "5px 9px", borderRadius: 8 }}>FREE</span>
            <LogoutButton />
          </div>
        </div>

        {/* Usage card */}
        <div style={{ marginTop: 18, background: "#15121f", border: "1px solid #2a2540", borderRadius: 16, padding: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: "#9b94b8", fontWeight: 600 }}>Sessions used</span>
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12 }}>{sessionsUsed} / {SESSION_LIMIT} free session</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#211d33", marginTop: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${usagePct}%`, background: "linear-gradient(90deg,#a78bfa,#7c3aed)", borderRadius: 3, transition: "width .4s ease" }} />
          </div>
          <Link href="/upgrade" style={{ marginTop: 13, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff", textDecoration: "none" }}>
            Upgrade to Standard — NPR 499/mo
          </Link>
        </div>

        {/* Sessions list */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
          <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 16 }}>Your sessions</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {loading && (
            <div style={{ height: 56, borderRadius: 13, background: "#15121f", border: "1px solid #2a2540", animation: "pulse 1.5s ease-in-out infinite" }} />
          )}
          {!loading && sessions.length === 0 && (
            <div style={{ fontSize: 13, color: "#6b6485", padding: "12px 0" }}>No sessions yet. <Link href="/upload" style={{ color: "#a78bfa", textDecoration: "none" }}>Start one →</Link></div>
          )}
          {sessions.map((s, idx) => (
            <Link key={s.id} href={`/session/${s.id}`} style={{ display: "flex", alignItems: "center", gap: 12, background: "#15121f", border: "1px solid #2a2540", borderRadius: 13, padding: 9, textDecoration: "none", color: "#f4f2fb" }}>
              <div style={{ display: "flex", gap: 3 }}>
                {[0, 1].map(i => {
                  const styleId = s.selected_styles?.[i];
                  const hue = styleId ? ((styleId.charCodeAt(0) * 7 + styleId.charCodeAt(1) * 13) % 80 + 260) : 290 + idx * 20;
                  return <div key={i} style={{ width: 30, height: 38, borderRadius: 6, background: stripeBg(hue) }} />;
                })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Session {idx + 1}</div>
                <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#9b94b8", marginTop: 2 }}>
                  {formatDate(s.created_at)} · {s.selected_styles?.length ?? 0} LOOKS
                </div>
              </div>
              <span style={{ color: "#6b6485", fontSize: 16 }}>›</span>
            </Link>
          ))}
        </div>

        {/* Saved looks */}
        <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: 16, marginTop: 20 }}>Saved looks</div>
        {!loading && savedLooks.length === 0 && (
          <p style={{ fontSize: 13, color: "#6b6485", marginTop: 10 }}>No saved looks yet — tap ♡ on any style to save it.</p>
        )}
        {savedLooks.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginTop: 12 }}>
            {savedLooks.map((look) => (
              <Link key={`${look.session_id}-${look.style_id}`} href={`/session/${look.session_id}/style/${look.style_id}`} style={{ aspectRatio: "3/4", borderRadius: 11, overflow: "hidden", position: "relative", background: "#15121f", display: "block" }}>
                {look.image_url
                  ? <Image src={look.image_url} alt={look.style_id} fill style={{ objectFit: "cover" }} sizes="120px" />
                  : <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(135deg,oklch(0.3 0.07 290),oklch(0.3 0.07 290) 7px,oklch(0.36 0.09 290) 7px,oklch(0.36 0.09 290) 14px)` }} />
                }
              </Link>
            ))}
          </div>
        )}

        <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
      </div>

      <BottomNav />
    </div>
    </AppShell>
  );
}
