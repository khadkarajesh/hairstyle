import { createClient } from "@/lib/supabase/server";
import { STYLES } from "@/lib/styles-data";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (SANDBOX || !HAS_SUPABASE || id === "demo") {
    return Response.json({
      status: "complete",
      completedStyles: STYLES.length,
      totalStyles: STYLES.length,
      faceShape: "oval",
    });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session } = await supabase
      .from("sessions")
      .select("status, face_shape")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!session) return Response.json({ error: "Not found" }, { status: 404 });

    const { count } = await supabase
      .from("session_styles")
      .select("*", { count: "exact", head: true })
      .eq("session_id", id)
      .not("image_url", "is", null);

    return Response.json({
      status: session.status,
      completedStyles: count ?? 0,
      totalStyles: STYLES.length,
      faceShape: session.face_shape,
    });
  } catch (err) {
    console.error("[GET /api/sessions/[id]/status]", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
