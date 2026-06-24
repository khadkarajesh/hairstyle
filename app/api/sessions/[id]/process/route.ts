import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { STYLES, STYLE_FACE_FIT } from "@/lib/styles-data";

export const runtime = "nodejs";
export const maxDuration = 30; // analysis only — no longer needs 120s

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

  // Sandbox / demo: simulate analysis only
  if (SANDBOX || !HAS_SUPABASE || id === "demo") {
    const mockStyles = ["comma_hair", "curtain_fringe", "textured_crop", "quiff", "side_part", "pompadour"];
    const stream = new ReadableStream({
      async start(ctrl) {
        ctrl.enqueue(sse({ step: "analyzing" }));
        await sleep(1500);
        ctrl.enqueue(sse({
          step: "face_done",
          faceShape: "oval",
          selectedStyles: mockStyles,
          hairAttributes: { hair_type: "straight", hair_density: "medium", forehead: "medium", jaw: "medium", reasoning: "Oval face suits most styles — selected a balanced mix." },
        }));
        ctrl.enqueue(sse({ step: "complete" }));
        ctrl.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  // Production: analysis only
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

        // ── Analyze photos + select styles with Claude ────────────────────────
        ctrl.enqueue(sse({ step: "analyzing" }));

        const [frontBuf, leftBuf, rightBuf] = await Promise.all([
          downloadImage(service, user.id, id, "front"),
          downloadImage(service, user.id, id, "left"),
          downloadImage(service, user.id, id, "right"),
        ]);

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const claudeRes = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              imgContent(frontBuf),
              imgContent(leftBuf),
              imgContent(rightBuf),
              {
                type: "text",
                text: `You are an expert hairstylist analyzing 3 photos (front, left profile, right profile) of a South Asian/Nepali man.

Analyze these physical attributes:
- face_shape: oval | round | square | heart | diamond | oblong
- hair_type: straight | wavy | curly
- hair_density: thin | medium | thick
- forehead: low | medium | high
- jaw: narrow | medium | wide

Then select the styles that would GENUINELY suit this person from the catalog below.
Select between 6 and 12 styles — only include styles that are a real good match. Do NOT force a fixed number.
Order them from best-fit to acceptable-fit.

Available style IDs:
comma_hair - Korean comma hair, soft S-wave sweeping fringe
curtain_fringe - Center-parted curtain bangs, medium length
textured_crop - Choppy top with mid skin fade
pompadour - Dramatic swept-back volume, high fade
slick_back - All hair combed straight back, wet look
quiff - Front volume swept up and back, faded sides
side_part - Classic neat side parting, tapered sides
crew_cut - Very short flat top, low skin fade
buzz_cut - Uniform ultra-short all over (3-6mm)
wavy_fringe - Natural wavy medium length, casual fringe
undercut - Long top, shaved/very short sides with sharp line
wolf_cut - Shaggy layered medium-long with curtain fringe
french_crop - Short blunt horizontal fringe, tapered sides
edgar_cut - Blunt straight fringe at hairline, mid fade
middle_part - Center-parted, falls symmetrically to ears
taper_fade - Gradual fade from top to skin at neckline
modern_mullet - Short front, longer flowing back
faux_hawk - Central raised ridge, faded sides
disconnected_undercut - Hard shaved line disconnect, long top
low_fade_comb_over - Side-combed top, low skin fade
spiky_textured - Short irregular spikes, tapered sides
bro_flow - Medium-long natural flowing hair, no fade
korean_perm - Soft permed waves, medium length all over
hard_part - Razor-shaved side parting line, combed top
high_skin_fade - Extreme high fade starting above temples

Respond ONLY with valid JSON:
{
  "face_shape": "oval|round|square|heart|diamond|oblong",
  "hair_type": "straight|wavy|curly",
  "hair_density": "thin|medium|thick",
  "forehead": "low|medium|high",
  "jaw": "narrow|medium|wide",
  "selected_styles": ["style_id", ...],
  "reasoning": "One sentence explaining key selection criteria"
}`,
              },
            ],
          }],
        });

        let faceShape = "oval";
        let selectedStyles: string[] = [];
        let hairAttributes: Record<string, string> = {};
        try {
          const txt = claudeRes.content[0].type === "text" ? claudeRes.content[0].text : "{}";
          const parsed = JSON.parse(txt.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
          if (parsed.face_shape) faceShape = parsed.face_shape;
          if (Array.isArray(parsed.selected_styles) && parsed.selected_styles.length > 0) {
            const validIds = new Set<string>(STYLES.map(s => s.id));
            selectedStyles = (parsed.selected_styles as string[]).filter(sid => validIds.has(sid));
          }
          hairAttributes = {
            hair_type:    parsed.hair_type    ?? "straight",
            hair_density: parsed.hair_density ?? "medium",
            forehead:     parsed.forehead     ?? "medium",
            jaw:          parsed.jaw          ?? "medium",
            reasoning:    parsed.reasoning    ?? "",
          };
        } catch { /* fallback below */ }

        // Fallback: face-shape fit map
        if (selectedStyles.length === 0) {
          selectedStyles = STYLES
            .filter(s => (STYLE_FACE_FIT[s.id] ?? []).includes(faceShape))
            .map(s => s.id)
            .slice(0, 10);
          if (selectedStyles.length === 0) selectedStyles = STYLES.slice(0, 10).map(s => s.id);
        }

        await service.from("sessions").update({
          face_shape:      faceShape,
          selected_styles: selectedStyles,
          hair_attributes: hairAttributes,
          status:          "complete",
        }).eq("id", id);

        ctrl.enqueue(sse({ step: "face_done", faceShape, selectedStyles, hairAttributes }));
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
