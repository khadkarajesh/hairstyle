"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      style={{ height: 36, borderRadius: 10, background: "transparent", border: "1px solid #2a2540", color: "#9b94b8", fontWeight: 600, fontSize: 12, cursor: "pointer", padding: "0 14px", whiteSpace: "nowrap" }}
    >
      Sign out
    </button>
  );
}
