import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { STYLES, STYLE_PROMPTS } from "@/lib/styles-data";

export const runtime = "nodejs";
export const maxDuration = 120;

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === "true";
const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const enc = new TextEncoder();
function sse(data: object) {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Sandbox / demo: stream a fake progress sequence
  if (SANDBOX || !HAS_SUPABASE || id === "demo") {
    const stream = new ReadableStream({
      async start(ctrl) {
        ctrl.enqueue(sse({ step: "analyzing" }));
        await sleep(1200);
        ctrl.enqueue(sse({ step: "face_done", faceShape: "oval" }));
        for (const s of STYLES) {
          ctrl.enqueue(sse({ step: "generating", styleId: s.id }));
          await sleep(300);
          ctrl.enqueue(sse({ step: "style_done", styleId: s.id, imageUrl: null }));
        }
        ctrl.enqueue(sse({ step: "complete" }));
        ctrl.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  // Production: real pipeline
  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          ctrl.enqueue(sse({ step: "error", message: "Unauthorized" }));
          ctrl.close();
          return;
        }

        const service = createServiceClient();

        // Verify session ownership
        const { data: session } = await service
          .from("sessions")
          .select("id, user_id, status")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (!session) {
          ctrl.enqueue(sse({ step: "error", message: "Session not found" }));
          ctrl.close();
          return;
        }

        // ── Step 1: Analyze face shape with Claude ────────────────────────────
        ctrl.enqueue(sse({ step: "analyzing" }));

        const [frontBuf, leftBuf, rightBuf] = await Promise.all([
          downloadImage(service, user.id, id, "front"),
          downloadImage(service, user.id, id, "left"),
          downloadImage(service, user.id, id, "right"),
        ]);

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const claudeRes = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 256,
          messages: [{
            role: "user",
            content: [
              imgContent(frontBuf),
              imgContent(leftBuf),
              imgContent(rightBuf),
              {
                type: "text",
                text: 'You are a professional hairstylist. Analyze these 3 photos (front, left profile, right profile). Identify the person\'s face shape. Respond ONLY with valid JSON: {"face_shape":"oval|round|square|heart|diamond|oblong"}',
              },
            ],
          }],
        });

        let faceShape = "oval";
        try {
          const txt = claudeRes.content[0].type === "text" ? claudeRes.content[0].text : "{}";
          const parsed = JSON.parse(txt.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
          if (parsed.face_shape) faceShape = parsed.face_shape;
        } catch { /* fallback to oval */ }

        await service.from("sessions").update({ face_shape: faceShape, status: "generating" }).eq("id", id);
        ctrl.enqueue(sse({ step: "face_done", faceShape }));

        // ── Step 2: Generate each hairstyle with gpt-image-1 ─────────────────
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        await Promise.allSettled(
          STYLES.map(async (style) => {
            ctrl.enqueue(sse({ step: "generating", styleId: style.id }));
            try {
              const prompt = STYLE_PROMPTS[style.id] ?? `Apply ${style.name} hairstyle to this person, keeping all facial features unchanged.`;
              const imgFile = new File([frontBuf as unknown as BlobPart], "face.jpg", { type: "image/jpeg" });

              const genRes = await openai.images.edit({
                model: "gpt-image-1",
                image: imgFile,
                prompt,
                n: 1,
                size: "1024x1024",
              });

              const b64 = genRes.data?.[0]?.b64_json;
              if (!b64) throw new Error("No image data");

              // Save to Supabase Storage
              const resultPath = `${user.id}/${id}/${style.id}.png`;
              const imgBytes = Buffer.from(b64, "base64");
              await service.storage.from("results").upload(resultPath, imgBytes, {
                contentType: "image/png",
                upsert: true,
              });

              // Build a signed URL (1 year)
              const { data: signed } = await service.storage
                .from("results")
                .createSignedUrl(resultPath, 60 * 60 * 24 * 365);

              const imageUrl = signed?.signedUrl ?? null;

              await service.from("session_styles").upsert({
                session_id: id,
                style_id: style.id,
                image_url: imageUrl,
              });

              ctrl.enqueue(sse({ step: "style_done", styleId: style.id, imageUrl }));
            } catch (err) {
              console.error(`[generate] ${style.id}`, err);
              ctrl.enqueue(sse({ step: "style_failed", styleId: style.id }));
            }
          })
        );

        // ── Done ──────────────────────────────────────────────────────────────
        await service.from("sessions").update({ status: "complete" }).eq("id", id);
        ctrl.enqueue(sse({ step: "complete" }));
      } catch (err) {
        console.error("[process]", err);
        ctrl.enqueue(sse({ step: "error", message: "Processing failed" }));
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function downloadImage(service: any, userId: string, sessionId: string, angle: string): Promise<Buffer> {
  const { data, error } = await service.storage
    .from("uploads")
    .download(`${userId}/${sessionId}/${angle}.jpg`);
  if (error || !data) throw error ?? new Error(`Missing ${angle} image`);
  return Buffer.from(await data.arrayBuffer());
}

function imgContent(buf: Buffer) {
  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/jpeg" as const,
      data: buf.toString("base64"),
    },
  };
}
