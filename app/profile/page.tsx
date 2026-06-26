"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/client";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SESSION_LIMIT = 1; // free tier

interface SavedLook { session_id: string; style_id: string; image_url: string | null; }

export default function ProfilePage() {
  const [name, setName]               = useState("Your Profile");
  const [email, setEmail]             = useState("");
  const [initial, setInitial]         = useState("?");
  const [savedLooks, setSaved]        = useState<SavedLook[]>([]);
  const [creditsRemaining, setCredits] = useState<number | null>(null);
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [loading, setLoading]         = useState(true);

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
      const { count } = await (supabase as any)
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count != null) setSessionsUsed(count);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: saved } = await (supabase as any)
        .from("session_styles")
        .select("session_id, style_id, image_url")
        .eq("saved", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (saved) setSaved(saved);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cr } = await (supabase as any)
        .from("credits")
        .select("sessions_remaining")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cr !== null) setCredits(cr.sessions_remaining);

      setLoading(false);
    };

    load();
  }, []);

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
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: creditsRemaining !== null ? "#a78bfa" : "#cdbfff", background: "#221c33", border: "1px solid #3a3358", padding: "5px 9px", borderRadius: 8 }}>
              {creditsRemaining !== null ? `${creditsRemaining} CREDIT${creditsRemaining !== 1 ? "S" : ""}` : "FREE"}
            </span>
            <LogoutButton />
          </div>
        </div>

        {/* Usage card */}
        {(() => {
          const remaining = creditsRemaining !== null
            ? creditsRemaining
            : Math.max(0, SESSION_LIMIT - sessionsUsed);
          const isPaid = creditsRemaining !== null;
          const low = remaining === 0;
          return (
            <div style={{ marginTop: 18, background: "#15121f", border: "1px solid #2a2540", borderRadius: 16, padding: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: "#9b94b8", fontWeight: 600 }}>Sessions remaining</span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: low ? "#f87171" : "#a78bfa" }}>
                  {remaining} {isPaid ? "paid" : "free"}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#211d33", marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: remaining === 0 ? "100%" : `${Math.min(100, remaining * 20)}%`, background: low ? "linear-gradient(90deg,#f87171,#ef4444)" : "linear-gradient(90deg,#a78bfa,#7c3aed)", borderRadius: 3, transition: "width .4s ease" }} />
              </div>
              <Link href="/upgrade" style={{ marginTop: 13, height: 42, borderRadius: 11, background: low ? "linear-gradient(135deg,#8b5cf6,#7c3aed)" : "#1e1a30", border: low ? "none" : "1px solid #3a3358", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: low ? 700 : 600, fontSize: 13, color: low ? "#fff" : "#a78bfa", textDecoration: "none", boxShadow: low ? "0 10px 22px -10px rgba(124,58,237,.7)" : "none" }}>
                {low ? "Buy sessions — from NPR 199 →" : "Buy more sessions →"}
              </Link>
            </div>
          );
        })()}

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
