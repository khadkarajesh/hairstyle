import { createClient, createServiceClient } from "@/lib/supabase/server";

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const FREE_SESSION_LIMIT = 1;

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

    const service = createServiceClient();

    // Count total sessions to determine free vs paid path
    const { count: sessionCount } = await service
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["complete", "generating", "analyzing"]);

    const totalSessions = sessionCount ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let creditsRow: { sessions_remaining: number } | null = null;

    if (totalSessions >= FREE_SESSION_LIMIT) {
      // Free session already used — need a paid credit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cr } = await (service as any)
        .from("credits")
        .select("sessions_remaining")
        .eq("user_id", user.id)
        .maybeSingle();
      creditsRow = cr;
      if (!creditsRow || creditsRow.sessions_remaining <= 0) {
        return Response.json(
          { error: "no_credits", sessionsUsed: totalSessions },
          { status: 402 }
        );
      }
    }

    const formData        = await request.formData();
    const front           = formData.get("front")            as File | null;
    const left            = formData.get("left")             as File | null;
    const right           = formData.get("right")            as File | null;
    const reference       = formData.get("reference")        as File | null;
    const reuseSessionId  = formData.get("reuse_session_id") as string | null;

    if (!reuseSessionId && (!front || !left || !right)) {
      return Response.json({ error: "All 3 images required" }, { status: 400 });
    }

    // If reusing, verify the source session belongs to this user
    if (reuseSessionId) {
      const { data: src } = await service
        .from("sessions")
        .select("id")
        .eq("id", reuseSessionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!src) return Response.json({ error: "Source session not found" }, { status: 404 });
    }

    // Create session record
    const { data: session, error: sessionErr } = await service
      .from("sessions")
      .insert({ user_id: user.id, status: "uploading" })
      .select()
      .single();

    if (sessionErr || !session) {
      throw sessionErr ?? new Error("Failed to create session");
    }

    if (reuseSessionId) {
      // Copy photos from previous session instead of uploading new ones
      await copyPhotos(service, user.id, reuseSessionId, session.id);
    } else {
      // Upload fresh photos
      const uploadTasks = [
        uploadImage(service, user.id, session.id, "front", front!),
        uploadImage(service, user.id, session.id, "left",  left!),
        uploadImage(service, user.id, session.id, "right", right!),
      ];
      const uploads = await Promise.all(uploadTasks);
      const failed  = uploads.find((u) => u.error);
      if (failed) throw failed.error;
    }

    // Upload optional reference photo in either case
    if (reference) await uploadImage(service, user.id, session.id, "reference", reference);

    // Mark session ready for processing
    await service
      .from("sessions")
      .update({ status: "analyzing" })
      .eq("id", session.id);

    // Decrement credit for paid sessions
    if (creditsRow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any)
        .from("credits")
        .update({
          sessions_remaining: creditsRow.sessions_remaining - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

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
  const contentType = file.type || "image/jpeg";
  return service.storage
    .from("uploads")
    .upload(path, bytes, { contentType, upsert: true });
}

// Copy front/left/right from a previous session into the new session's folder
async function copyPhotos(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  userId: string,
  fromSessionId: string,
  toSessionId: string,
) {
  await Promise.all(["front", "left", "right"].map(async (angle) => {
    const src  = `${userId}/${fromSessionId}/${angle}.jpg`;
    const dest = `${userId}/${toSessionId}/${angle}.jpg`;
    const { data, error } = await service.storage.from("uploads").download(src);
    if (error || !data) return; // silently skip missing angles
    const bytes = await data.arrayBuffer();
    await service.storage.from("uploads").upload(dest, bytes, { contentType: "image/jpeg", upsert: true });
  }));
}
