import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { STYLE_PROMPTS } from "@/lib/styles-data";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; styleId: string }> }
) {
  const { id, styleId } = await params;
  const { angle } = (await req.json()) as { angle: "front" | "left" | "right" };

  if (angle !== "front" && angle !== "left" && angle !== "right") {
    return NextResponse.json({ error: "invalid angle" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const service = createServiceClient();

  // Verify session belongs to user
  const { data: session } = await service
    .from("sessions")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  const col = angle === "front" ? "image_url" : angle === "left" ? "image_url_left" : "image_url_right";

  // Return cached result if already generated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: styleRow } = await (service as any)
    .from("session_styles")
    .select("image_url, image_url_left, image_url_right")
    .eq("session_id", id)
    .eq("style_id", styleId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((styleRow as any)?.[col]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ url: (styleRow as any)[col] });
  }

  // Download the user's angle photo
  const filename = `${angle}.jpg`;
  const { data: photoData, error: photoErr } = await service.storage
    .from("uploads")
    .download(`${user.id}/${id}/${filename}`);

  if (photoErr || !photoData) {
    return NextResponse.json({ error: "source photo not found" }, { status: 404 });
  }

  const photoBuf = Buffer.from(await photoData.arrayBuffer());
  const photoFile = new File([photoBuf as unknown as BlobPart], filename, { type: "image/jpeg" });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = STYLE_PROMPTS[styleId] ?? `Apply ${styleId} hairstyle to this person, keeping all facial features unchanged.`;

  let genRes;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      genRes = await openai.images.edit({
        model: "gpt-image-2",
        image: photoFile,
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "medium",
      });
      break;
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (err as any)?.status;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code   = (err as any)?.code;
      if (status === 429 && attempt < 3) {
        await new Promise(r => setTimeout(r, 20_000));
        continue;
      }
      if (code === "billing_hard_limit_reached" || status === 400) {
        return NextResponse.json({ error: "billing_limit" }, { status: 402 });
      }
      throw err;
    }
  }

  const b64 = genRes?.data?.[0]?.b64_json;
  if (!b64) return NextResponse.json({ error: "generation failed" }, { status: 500 });

  // Store in results bucket — front uses styleId.png to match the process route
  const resultPath = angle === "front"
    ? `${user.id}/${id}/${styleId}.png`
    : `${user.id}/${id}/${styleId}_${angle}.png`;
  const imgBytes = Buffer.from(b64, "base64");
  const { error: uploadErr } = await service.storage
    .from("results")
    .upload(resultPath, imgBytes, { contentType: "image/png", upsert: true });

  if (uploadErr) return NextResponse.json({ error: "storage failed" }, { status: 500 });

  // Signed URL (1 year)
  const { data: signed } = await service.storage
    .from("results")
    .createSignedUrl(resultPath, 60 * 60 * 24 * 365);
  const url = signed?.signedUrl ?? null;

  // Upsert so this works even when no row exists yet (e.g. front generation failed during session)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from("session_styles")
    .upsert({ session_id: id, style_id: styleId, [col]: url }, { onConflict: "session_id,style_id" });

  return NextResponse.json({ url });
}
