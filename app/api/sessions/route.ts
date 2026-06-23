import { createClient, createServiceClient } from "@/lib/supabase/server";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  // Sandbox: return a predictable demo session immediately
  if (SANDBOX || !HAS_SUPABASE) {
    await new Promise((r) => setTimeout(r, 400));
    return Response.json({ sessionId: "demo" });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const front = formData.get("front") as File | null;
    const left = formData.get("left") as File | null;
    const right = formData.get("right") as File | null;

    if (!front || !left || !right) {
      return Response.json({ error: "All 3 images required" }, { status: 400 });
    }

    // Create session record
    const service = createServiceClient();
    const { data: session, error: sessionErr } = await service
      .from("sessions")
      .insert({ user_id: user.id, status: "uploading" })
      .select()
      .single();

    if (sessionErr || !session) {
      throw sessionErr ?? new Error("Failed to create session");
    }

    // Upload images to Supabase Storage
    const uploads = await Promise.all([
      uploadImage(service, user.id, session.id, "front", front),
      uploadImage(service, user.id, session.id, "left", left),
      uploadImage(service, user.id, session.id, "right", right),
    ]);

    const failed = uploads.find((u) => u.error);
    if (failed) throw failed.error;

    // Mark session ready for processing
    await service
      .from("sessions")
      .update({ status: "analyzing" })
      .eq("id", session.id);

    return Response.json({ sessionId: session.id });
  } catch (err) {
    console.error("[POST /api/sessions]", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}

async function uploadImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  userId: string,
  sessionId: string,
  angle: string,
  file: File
) {
  const bytes = await file.arrayBuffer();
  const path = `${userId}/${sessionId}/${angle}.jpg`;
  return service.storage
    .from("uploads")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
}
