/**
 * Generates reference images for all 25 hairstyles using GPT-Image-2 (text-to-image).
 * Uploads results to a public Supabase bucket "style-refs".
 * Resumable: skips styles that already have an entry in style-ref-urls.json.
 *
 * Run from the project root:
 *   npx tsx scripts/generate-style-refs.ts
 *
 * Reads credentials from .env.local automatically.
 * Re-run at any time — already-generated styles are skipped.
 */

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd(); // run from project root

// ── Load .env.local if env vars aren't already set ────────────────────────────
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const OPENAI_KEY     = process.env.OPENAI_API_KEY;
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENAI_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars. Need: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const openai   = new OpenAI({ apiKey: OPENAI_KEY });
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const BUCKET     = "style-refs";
const OUTPUT_MAP = path.join(ROOT, "scripts", "style-ref-urls.json");

// ── Rate limit: 5 images/min → batch 4, wait 62s between batches ─────────────
const BATCH_SIZE     = 4;
const BATCH_WINDOW   = 62_000; // ms

// ── Portrait base for standalone generation (NOT editing) ─────────────────────
const GEN_BASE =
  "Photorealistic studio portrait photograph. " +
  "Subject: young South Asian / Nepali man, approximately 23–27 years old, " +
  "oval face shape, clean-shaven, neutral relaxed expression, dark brown eyes, " +
  "medium warm brown skin tone, thick dark black hair. " +
  "Lighting: professional softbox, even, flattering. Background: plain light grey seamless. " +
  "Framing: head and shoulders, front-facing, centred. " +
  "High resolution, sharp focus, natural skin texture, photorealistic — NOT an illustration or painting. ";

// ── Per-style generation prompts ──────────────────────────────────────────────
// These describe the SAME South Asian male subject with a specific hairstyle.
// They are standalone prompts for images.generate() — not images.edit().
const STYLE_GEN_PROMPTS: Record<string, string> = {
  comma_hair:
    GEN_BASE +
    "Hairstyle: Korean comma hair (쉼표 머리). " +
    "Medium length (4–6 inches), soft S-shaped wave that sweeps diagonally across the forehead, " +
    "ends curling inward like a comma. Sides tapered naturally, not shaved. " +
    "Soft, slightly tousled, youthful — no product shine.",

  curtain_fringe:
    GEN_BASE +
    "Hairstyle: curtain fringe. " +
    "Hair parted exactly in the centre. Soft medium-length bangs falling symmetrically on both sides of the forehead, " +
    "framing the face. Wispy and slightly wavy. Medium overall length, effortless natural finish.",

  textured_crop:
    GEN_BASE +
    "Hairstyle: textured crop with mid skin fade. " +
    "Sides faded to skin. Top is short (1.5–2 inches) with choppy texture and slight forward-pushed fringe. " +
    "Matte finish. Clear disconnection between faded sides and textured top.",

  pompadour:
    GEN_BASE +
    "Hairstyle: modern pompadour. " +
    "Hair on top swept upward and back with dramatic volume (3–4 inches high at front). " +
    "Sides are high skin fade. Top is smooth, sleek, and shiny, swept back in a wave.",

  slick_back:
    GEN_BASE +
    "Hairstyle: slick back. " +
    "All hair combed straight back from forehead, lying flat and close to skull. " +
    "High-gloss wet look finish. Sides neatly tapered. No hair falls forward.",

  quiff:
    GEN_BASE +
    "Hairstyle: modern quiff. " +
    "Front section swept upward and slightly back, 2–3 inches of height at front hairline. " +
    "Sides faded short. Well-defined structure with medium-hold product.",

  side_part:
    GEN_BASE +
    "Hairstyle: classic side part. " +
    "Sharp clean parting line on the left side. Hair combed neatly flat to each side. " +
    "Sides slightly tapered. Natural low-shine finish. Professional gentleman look.",

  crew_cut:
    GEN_BASE +
    "Hairstyle: crew cut with low skin fade. " +
    "Sides faded to skin. Top very short and flat (0.5–1 inch), slightly longer at front hairline. " +
    "Military-clean look, no product.",

  buzz_cut:
    GEN_BASE +
    "Hairstyle: buzz cut. " +
    "Uniform 3–5 mm length (grade 1–2 clipper) all over — sides, back, and top. " +
    "No fade, no taper. Scalp slightly visible through the short hair.",

  wavy_fringe:
    GEN_BASE +
    "Hairstyle: natural wavy fringe. " +
    "Medium length on top (3–5 inches) with natural loose waves throughout, air-dried. " +
    "Fringe falls casually over forehead. Sides medium length, not faded. Relaxed effortless look.",

  undercut:
    GEN_BASE +
    "Hairstyle: classic undercut. " +
    "Sides and back shaved very short (grade 0–1) with a clearly defined disconnection line. " +
    "Top is kept long (3–5 inches), swept back. Extreme contrast between shaved sides and long styled top.",

  wolf_cut:
    GEN_BASE +
    "Hairstyle: modern wolf cut. " +
    "Medium-long hair (4–6 inches) with heavy layers and shaggy texture. " +
    "Curtain fringe across forehead. Sides not faded — layered. Voluminous, slightly messy, K-pop inspired.",

  french_crop:
    GEN_BASE +
    "Hairstyle: French crop. " +
    "Short overall, sides tapered. Top short (1–1.5 inches) with a blunt horizontal fringe " +
    "cut straight across just above the forehead. Clean European barbershop aesthetic.",

  edgar_cut:
    GEN_BASE +
    "Hairstyle: Edgar cut with mid fade. " +
    "Sides faded to skin. Top short (1–1.5 inches) with completely straight blunt horizontal fringe " +
    "cut right at the hairline. Sharp and geometric. Clean faded sides.",

  middle_part:
    GEN_BASE +
    "Hairstyle: middle part. " +
    "Hair parted exactly down the center. Both sides fall symmetrically, length touching the ears. " +
    "Flat, natural finish, no product. Korean-inspired clean aesthetic.",

  taper_fade:
    GEN_BASE +
    "Hairstyle: taper fade. " +
    "Hair gradually fades from natural length on top down to skin at neckline. " +
    "Smooth gradual fade starting mid-temple. Top medium length (2–3 inches). Classic barbershop look.",

  modern_mullet:
    GEN_BASE +
    "Hairstyle: modern mullet. " +
    "Short textured front and sides, back noticeably longer (3–4 inches past collar). " +
    "Slightly messy on top. Contemporary version — not the retro exaggerated mullet.",

  faux_hawk:
    GEN_BASE +
    "Hairstyle: faux hawk. " +
    "Sides faded short. Center strip from front to crown pushed upward into a 2–3 inch raised ridge. " +
    "Styled with product. Raised central strip contrasts sharply with short sides.",

  disconnected_undercut:
    GEN_BASE +
    "Hairstyle: disconnected undercut. " +
    "Sides and back shaved to skin with a sharp visible disconnection line — no blending whatsoever. " +
    "Long top (3–5 inches) swept back. Harsh contrast line is the signature feature.",

  low_fade_comb_over:
    GEN_BASE +
    "Hairstyle: comb over fade with low skin fade. " +
    "Sides fade from skin at bottom up to natural length. Hair on top combed to one side with defined parting. " +
    "Medium length top (2–3 inches). Professional modern barbershop look.",

  spiky_textured:
    GEN_BASE +
    "Hairstyle: spiky textured. " +
    "Short top (1.5–2.5 inches) styled into multiple short irregular spikes in different directions using matte product. " +
    "Sides slightly tapered. Youthful high-energy look.",

  bro_flow:
    GEN_BASE +
    "Hairstyle: bro flow. " +
    "Medium-long hair (3–5 inches) flowing naturally, swept back from forehead, falling around ears and neck. " +
    "Air-dried, no fade, no taper. Relaxed athlete-inspired style.",

  korean_perm:
    GEN_BASE +
    "Hairstyle: Korean perm wave. " +
    "Medium length (3–5 inches) with soft loose S-shaped perm waves throughout — not tight curls, gentle flowing waves. " +
    "Bouncy and voluminous. Sides not faded — medium length all around. Youthful K-pop aesthetic.",

  hard_part:
    GEN_BASE +
    "Hairstyle: hard part. " +
    "A razor-shaved parting line on the left side cuts cleanly through the hair. " +
    "Hair on top combed neatly away from the parting. Sides tapered. " +
    "The razor-cut parting line is the defining feature. Medium shine finish.",

  high_skin_fade:
    GEN_BASE +
    "Hairstyle: high skin fade. " +
    "Fade starts very high on the head, just above the temples. " +
    "Completely bald on sides up to the hairline. Extreme contrast between bald sides and fuller top. " +
    "Clean, barbershop-sharp finish.",
};

const STYLE_IDS = [
  "comma_hair", "curtain_fringe", "textured_crop", "pompadour", "slick_back",
  "quiff", "side_part", "crew_cut", "buzz_cut", "wavy_fringe",
  "undercut", "wolf_cut", "french_crop", "edgar_cut", "middle_part",
  "taper_fade", "modern_mullet", "faux_hawk", "disconnected_undercut",
  "low_fade_comb_over", "spiky_textured", "bro_flow", "korean_perm",
  "hard_part", "high_skin_fade",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadUrls(): Record<string, string> {
  try { return JSON.parse(fs.readFileSync(OUTPUT_MAP, "utf-8")); } catch { return {}; }
}

function saveUrls(urls: Record<string, string>) {
  fs.writeFileSync(OUTPUT_MAP, JSON.stringify(urls, null, 2));
}

async function generateAndUpload(styleId: string): Promise<string | null> {
  const prompt = STYLE_GEN_PROMPTS[styleId];
  if (!prompt) { console.log(`  ⚠  no prompt for ${styleId}`); return null; }

  process.stdout.write(`  generating ${styleId} ... `);

  let b64: string | null | undefined;
  try {
    // GPT-Image-2 always returns b64_json — response_format is not accepted
    const res = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    });
    b64 = res.data?.[0]?.b64_json;
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (err as any)?.message ?? String(err);
    console.log(`FAILED (${msg})`);
    return null;
  }

  if (!b64) { console.log("no image data"); return null; }

  const imgBytes = Buffer.from(b64, "base64");
  const filePath = `${styleId}.png`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, imgBytes, { contentType: "image/png", upsert: true });

  if (uploadErr) { console.log(`upload failed: ${uploadErr.message}`); return null; }

  const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  const url = pubData.publicUrl;
  console.log(`done`);
  return url;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\nHairStyle AI — style reference image generator");
  console.log(`Model: gpt-image-2  |  Bucket: ${BUCKET}  |  Batch: ${BATCH_SIZE}/62s\n`);

  // Create bucket if it doesn't exist
  const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg"],
  });
  if (bucketErr && !bucketErr.message.toLowerCase().includes("already exists")) {
    console.error("Failed to create bucket:", bucketErr.message);
    process.exit(1);
  }

  const urls     = loadUrls();
  const done     = new Set(Object.keys(urls));
  const remaining = STYLE_IDS.filter(id => !done.has(id));

  if (remaining.length === 0) {
    console.log(`All ${STYLE_IDS.length} styles already generated.`);
    console.log(`URLs at: ${OUTPUT_MAP}`);
    return;
  }

  console.log(`Already done: ${done.size}  |  Remaining: ${remaining.length}\n`);

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches}: [${batch.join(", ")}]`);
    const batchStart = Date.now();

    // Run batch sequentially within each batch to keep errors manageable
    for (const styleId of batch) {
      const url = await generateAndUpload(styleId);
      if (url) {
        urls[styleId] = url;
        saveUrls(urls); // save after each success so progress is never lost
      }
    }

    // Respect rate limit between batches
    if (i + BATCH_SIZE < remaining.length) {
      const elapsed = Date.now() - batchStart;
      const wait    = Math.max(0, BATCH_WINDOW - elapsed);
      if (wait > 0) {
        console.log(`\nRate limit pause: ${Math.round(wait / 1000)}s\n`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }

  const successCount = Object.keys(urls).length;
  console.log(`\nDone. ${successCount}/${STYLE_IDS.length} styles generated.`);
  console.log(`URLs saved to: ${OUTPUT_MAP}\n`);

  // Print the URL map for easy copy-paste into styles-data.ts
  console.log("// Paste into lib/styles-data.ts:");
  console.log("export const STYLE_REF_URLS: Partial<Record<string, string>> = {");
  for (const [id, url] of Object.entries(urls)) {
    console.log(`  ${id}: "${url}",`);
  }
  console.log("};");
}

main().catch(err => { console.error(err); process.exit(1); });
