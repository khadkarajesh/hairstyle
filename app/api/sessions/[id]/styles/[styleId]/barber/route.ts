import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; styleId: string }> }
) {
  const { id, styleId } = await params;
  const { shown_to_barber } = (await req.json()) as { shown_to_barber: boolean };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const service = createServiceClient();

  // Verify session belongs to user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await (service as any)
    .from("sessions")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from("session_styles")
    .upsert(
      { session_id: id, style_id: styleId, shown_to_barber },
      { onConflict: "session_id,style_id" }
    );

  return NextResponse.json({ shown_to_barber });
}
