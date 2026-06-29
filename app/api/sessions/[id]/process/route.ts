import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { STYLES, STYLES_MAP, STYLE_FACE_FIT, STYLE_MIN_DENSITY } from "@/lib/styles-data";

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

        // Collect prior sessions — used for seen-styles dedup, preference signals,
        // and to recover stored face/hair attributes so we don't re-detect them
        const { data: priorSessions } = await service
          .from("sessions")
          .select("id, selected_styles, face_shape, hair_attributes, created_at")
          .eq("user_id", user.id)
          .neq("id", id)
          .not("selected_styles", "is", null)
          .order("created_at", { ascending: false });

        const priorSessionIds = (priorSessions ?? []).map(
          (s: { id: string }) => s.id
        );
        const seenStyleIds = new Set<string>(
          (priorSessions ?? []).flatMap(
            (s: { id: string; selected_styles: string[] | null }) => s.selected_styles ?? []
          )
        );
        const seenList = [...seenStyleIds].join(", ");

        // Use stored face/hair attributes from the most recent prior session
        // Face shape is stable — no need to re-detect it every session
        type PriorSession = { face_shape?: string; hair_attributes?: Record<string, string> };
        const mostRecent = (priorSessions ?? [])[0] as PriorSession | undefined;
        const knownFaceShape = mostRecent?.face_shape ?? null;
        const knownHairAttrs = mostRecent?.hair_attributes ?? null;

        // Styles user showed to barber = strongest intent signal (acted on it)
        let barberStyleNames: string[] = [];
        if (priorSessionIds.length > 0) {
          const { data: barberRows } = await service
            .from("session_styles")
            .select("style_id")
            .in("session_id", priorSessionIds)
            .eq("shown_to_barber", true);
          barberStyleNames = (barberRows ?? [])
            .map((r: { style_id: string }) => STYLES_MAP[r.style_id]?.name)
            .filter(Boolean) as string[];
        }

        // Styles the user saved = positive preference signal for session 2+
        let savedStyleNames: string[] = [];
        if (priorSessionIds.length > 0) {
          const { data: savedRows } = await service
            .from("session_styles")
            .select("style_id")
            .in("session_id", priorSessionIds)
            .eq("saved", true);
          savedStyleNames = (savedRows ?? [])
            .map((r: { style_id: string }) => STYLES_MAP[r.style_id]?.name)
            .filter(Boolean) as string[];
        }

        // ── Analyze photos + select styles with Claude ────────────────────────
        ctrl.enqueue(sse({ step: "analyzing" }));

        const [frontBuf, leftBuf, rightBuf] = await Promise.all([
          downloadImage(service, user.id, id, "front"),
          downloadImage(service, user.id, id, "left"),
          downloadImage(service, user.id, id, "right"),
        ]);

        // Optional celebrity/influencer reference (session 2+)
        const referenceBuf = await downloadImage(service, user.id, id, "reference").catch(() => null);

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const imageMessages = [
          imgContent(frontBuf),
          imgContent(leftBuf),
          imgContent(rightBuf),
          ...(referenceBuf ? [
            { type: "text" as const, text: "The following image is a style reference — a celebrity, K-pop idol, or influencer whose hairstyle the user wants to emulate. Study their hair carefully: note the length, texture, structure, and overall aesthetic. Identify the style IDs from the catalog that most closely match. Ensure those styles (or styles with the same length/texture/structure) appear in your selected_styles output, provided they suit this person's face shape." },
            imgContent(referenceBuf),
          ] : []),
        ];

        const priorProfileHint = knownFaceShape
          ? `\nFor reference, your previous reading of this person was: face_shape=${knownFaceShape}${knownHairAttrs ? `, hair_type=${knownHairAttrs.hair_type ?? "?"}, hair_density=${knownHairAttrs.hair_density ?? "?"}, forehead=${knownHairAttrs.forehead ?? "?"}, jaw=${knownHairAttrs.jaw ?? "?"}` : ""}. Update any attribute that clearly differs from what you see in these photos; keep values that match.`
          : "";

        const analysisInstruction = `Analyze these physical attributes from the 3 photos (front, left profile, right profile):
- face_shape: oval | round | square | heart | diamond | oblong
- hair_type: straight | wavy | curly
- hair_density: thin | medium | thick
- forehead: low | medium | high
- jaw: narrow | medium | wide${priorProfileHint}

IMPORTANT — hair density affects which styles are achievable: thin hair cannot support high-volume styles (pompadour, wolf cut). Do NOT recommend styles whose defining feature is volume or density that this person's hair cannot physically produce.`;

        const claudeRes = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              ...imageMessages,
              {
                type: "text",
                text: `You are an expert hairstylist selecting hairstyles for a South Asian/Nepali man.${referenceBuf ? " The user has provided a style reference image (shown above) — identify which catalog style IDs most closely match the reference person's hairstyle and prioritise those or styles with the same length, texture, and structure." : ""}

${analysisInstruction}

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

${barberStyleNames.length > 0
  ? `The user showed these styles to their actual barber (strongest signal — they committed to getting the look): ${barberStyleNames.join(", ")}. Weight heavily toward styles with similar length, texture, or structure. Natural evolutions of these styles are ideal. Do NOT recommend these exact styles.\n\n`
  : ""}${savedStyleNames.length > 0
  ? `The user previously saved these styles (they liked them): ${savedStyleNames.join(", ")}. Weight your recommendations toward styles with similar texture, length, or structure — these reveal their taste. Do NOT recommend the saved styles themselves; they want to discover new looks.\n\n`
  : ""}${seenList
  ? `The user has already seen these styles in a previous session: ${seenList}. Prefer styles NOT in this list — only include a previously-seen style if it is clearly the best fit for this face.\n\n`
  : ""}Respond ONLY with valid JSON:
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

        let faceShape = knownFaceShape ?? "oval";
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
            hair_type:    parsed.hair_type    ?? knownHairAttrs?.hair_type    ?? "straight",
            hair_density: parsed.hair_density ?? knownHairAttrs?.hair_density ?? "medium",
            forehead:     parsed.forehead     ?? knownHairAttrs?.forehead     ?? "medium",
            jaw:          parsed.jaw          ?? knownHairAttrs?.jaw          ?? "medium",
            reasoning:    parsed.reasoning    ?? "",
          };
        } catch { /* fallback below */ }

        // Density filter: remove styles that require more hair density than the person has.
        // This prevents recommending pompadour/wolf cut etc. for thin-hair users —
        // styles that look wrong in generation because their descriptions demand volume
        // the hair physically cannot produce.
        const density = hairAttributes.hair_density;
        if (density === "thin") {
          selectedStyles = selectedStyles.filter(sid => (STYLE_MIN_DENSITY[sid] ?? "any") === "any");
        } else if (density === "medium") {
          selectedStyles = selectedStyles.filter(sid => (STYLE_MIN_DENSITY[sid] ?? "any") !== "thick");
        }

        // Fallback: face-shape fit map (also density-filtered)
        if (selectedStyles.length === 0) {
          selectedStyles = STYLES
            .filter(s => (STYLE_FACE_FIT[s.id] ?? []).includes(faceShape))
            .filter(s => {
              const minD = STYLE_MIN_DENSITY[s.id] ?? "any";
              if (density === "thin") return minD === "any";
              if (density === "medium") return minD !== "thick";
              return true;
            })
            .map(s => s.id)
            .slice(0, 10);
          if (selectedStyles.length === 0) selectedStyles = STYLES.slice(0, 10).map(s => s.id);
        }

        // Free session (first session) — cap to 4 styles to control API cost
        const isFreeSession = (priorSessions ?? []).length === 0;
        if (isFreeSession) {
          selectedStyles = selectedStyles.slice(0, 4);
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

function detectMediaType(buf: Buffer): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45) return "image/webp";
  return "image/jpeg";
}

function imgContent(buf: Buffer) {
  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: detectMediaType(buf),
      data: buf.toString("base64"),
    },
  };
}
