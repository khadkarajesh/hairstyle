import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LatestSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await (supabase as any)
    .from("sessions")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (session?.id) {
    redirect(`/session/${session.id}`);
  }

  redirect("/upload");
}
