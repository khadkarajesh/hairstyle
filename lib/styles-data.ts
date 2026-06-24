export const STYLES = [
  // ── Original 10 ──────────────────────────────────────────────────────────
  { id: "comma_hair",              name: "Comma Hair",              tag: "K-POP",        hue: 270 },
  { id: "curtain_fringe",          name: "Curtain Fringe",          tag: "K-POP",        hue: 330 },
  { id: "textured_crop",           name: "Textured Crop",           tag: "FOOTBALLER",   hue: 292 },
  { id: "pompadour",               name: "Pompadour",               tag: "BOLLYWOOD",    hue: 312 },
  { id: "slick_back",              name: "Slick Back",              tag: "BOLLYWOOD",    hue: 300 },
  { id: "quiff",                   name: "Quiff",                   tag: "MODERN",       hue: 286 },
  { id: "side_part",               name: "Side Part",               tag: "PROFESSIONAL", hue: 278 },
  { id: "crew_cut",                name: "Crew Cut",                tag: "PROFESSIONAL", hue: 24  },
  { id: "buzz_cut",                name: "Buzz Cut",                tag: "CLEAN CUT",    hue: 260 },
  { id: "wavy_fringe",             name: "Wavy Fringe",             tag: "NATURAL",      hue: 350 },
  // ── Extended catalog ─────────────────────────────────────────────────────
  { id: "undercut",                name: "Undercut",                tag: "MODERN",       hue: 240 },
  { id: "wolf_cut",                name: "Wolf Cut",                tag: "K-POP",        hue: 320 },
  { id: "french_crop",             name: "French Crop",             tag: "STREETWEAR",   hue: 200 },
  { id: "edgar_cut",               name: "Edgar Cut",               tag: "STREETWEAR",   hue: 30  },
  { id: "middle_part",             name: "Middle Part",             tag: "K-POP",        hue: 180 },
  { id: "taper_fade",              name: "Taper Fade",              tag: "BARBERSHOP",   hue: 45  },
  { id: "modern_mullet",           name: "Modern Mullet",           tag: "RETRO",        hue: 220 },
  { id: "faux_hawk",               name: "Faux Hawk",               tag: "EDGY",         hue: 60  },
  { id: "disconnected_undercut",   name: "Disconnected Undercut",   tag: "MODERN",       hue: 190 },
  { id: "low_fade_comb_over",      name: "Comb Over Fade",          tag: "PROFESSIONAL", hue: 210 },
  { id: "spiky_textured",          name: "Spiky Textured",          tag: "RETRO",        hue: 15  },
  { id: "bro_flow",                name: "Bro Flow",                tag: "NATURAL",      hue: 75  },
  { id: "korean_perm",             name: "Korean Perm",             tag: "K-POP",        hue: 135 },
  { id: "hard_part",               name: "Hard Part",               tag: "PROFESSIONAL", hue: 165 },
  { id: "high_skin_fade",          name: "High Skin Fade",          tag: "BARBERSHOP",   hue: 340 },
] as const;

export type StyleId   = (typeof STYLES)[number]["id"];
export type StyleItem = (typeof STYLES)[number];

export const STYLES_MAP: Record<string, StyleItem> = Object.fromEntries(
  STYLES.map(s => [s.id, s])
) as Record<string, StyleItem>;

// Face shapes each style flatters most
export const STYLE_FACE_FIT: Record<string, string[]> = {
  // original 10
  comma_hair:             ["oval", "round", "heart", "oblong"],
  curtain_fringe:         ["round", "square", "heart", "diamond", "oblong"],
  textured_crop:          ["oval", "square", "diamond"],
  pompadour:              ["oval", "round", "oblong"],
  slick_back:             ["oval", "square", "diamond"],
  quiff:                  ["oval", "round", "oblong"],
  side_part:              ["oval", "heart", "diamond"],
  crew_cut:               ["oval", "square"],
  buzz_cut:               ["oval", "square", "diamond"],
  wavy_fringe:            ["round", "heart", "oblong", "diamond"],
  // extended catalog
  undercut:               ["oval", "square", "diamond", "heart", "oblong"],
  wolf_cut:               ["oval", "round", "heart", "oblong"],
  french_crop:            ["oval", "square", "diamond"],
  edgar_cut:              ["oval", "square", "round"],
  middle_part:            ["oval", "heart", "oblong", "diamond"],
  taper_fade:             ["oval", "square", "diamond", "round"],
  modern_mullet:          ["oval", "round", "heart"],
  faux_hawk:              ["oval", "square", "oblong"],
  disconnected_undercut:  ["oval", "square", "diamond"],
  low_fade_comb_over:     ["oval", "heart", "diamond", "square"],
  spiky_textured:         ["oval", "square", "round"],
  bro_flow:               ["oval", "heart", "oblong", "round"],
  korean_perm:            ["oval", "round", "heart", "oblong"],
  hard_part:              ["oval", "square", "heart"],
  high_skin_fade:         ["oval", "square", "diamond", "round"],
};

export function stripeBg(hue: number) {
  return `repeating-linear-gradient(135deg, oklch(0.27 0.06 ${hue}), oklch(0.27 0.06 ${hue}) 9px, oklch(0.33 0.085 ${hue}) 9px, oklch(0.33 0.085 ${hue}) 18px)`;
}

export function stripeBgLight(hue: number) {
  return `repeating-linear-gradient(135deg, oklch(0.93 0.035 ${hue}), oklch(0.93 0.035 ${hue}) 9px, oklch(0.88 0.05 ${hue}) 9px, oklch(0.88 0.05 ${hue}) 18px)`;
}

// Shared preamble for all style prompts
const BASE =
  "Modify ONLY the hairstyle in this photograph of a South Asian/Nepali man. " +
  "Do NOT change anything else — face shape, skin tone, complexion, facial features, eyes, eyebrows, nose, lips, ears, " +
  "facial hair, clothing, jewellery, background, lighting, shadows, camera angle, or expression must remain exactly the same. " +
  "The person must look completely identical except for their hair. " +
  "CRITICAL: Keep the subject's head, face, and body at the exact same position, scale, and crop within the frame as in the original photograph. " +
  "Do NOT zoom in, zoom out, reframe, adjust camera distance, or reposition the subject in any way. " +
  "The output image must have identical framing and subject placement to the input. " +
  "Produce a photorealistic result that looks like a real photograph, not an illustration. ";

export const STYLE_PROMPTS: Record<string, string> = {
  // ── Original 10 ──────────────────────────────────────────────────────────
  comma_hair:
    BASE +
    "Hairstyle: Korean comma hair (쉼표 머리). " +
    "Top and front hair is medium length (4–6 inches). A soft S-shaped wave or curl sweeps diagonally across the forehead, " +
    "with the ends curling inward like a comma shape. Sides are tapered but not shaved — blended naturally. " +
    "The finish is soft, slightly tousled, and youthful with no product shine.",

  curtain_fringe:
    BASE +
    "Hairstyle: curtain fringe (curtain bangs). " +
    "Hair is parted exactly in the centre. Soft bangs fall symmetrically on both sides of the forehead, framing the face. " +
    "Overall length is medium (touching the ears or slightly below). The fringe is wispy and slightly wavy, parting naturally down the middle. " +
    "Sides blend into the fringe. Clean and effortless with a natural finish.",

  textured_crop:
    BASE +
    "Hairstyle: textured crop with mid skin fade. " +
    "Sides and back faded to skin (very short, almost bald at the bottom, blending up). " +
    "Top is short (1.5–2 inches) with strong, choppy texture and a slight forward-pushed fringe. " +
    "Matte finish — no shine. The disconnection between the faded sides and textured top is clearly visible.",

  pompadour:
    BASE +
    "Hairstyle: modern pompadour. " +
    "All hair on top is swept upward and back with dramatic volume (3–4 inches high at the front). " +
    "Sides are faded very short (high fade, almost to skin). " +
    "The top is smooth, sleek, and shiny — swept back in a wave. " +
    "The contrast between the voluminous shiny top and the tight faded sides is the defining feature.",

  slick_back:
    BASE +
    "Hairstyle: slick back. " +
    "All hair — including the fringe — is combed straight back from the forehead, lying flat and close to the skull. " +
    "High-gloss wet look or strong-hold pomade finish. " +
    "Sides are neatly tapered or lightly faded. No hair falls forward. Every strand is swept cleanly backward.",

  quiff:
    BASE +
    "Hairstyle: modern quiff. " +
    "The front section of hair is swept upward and slightly back, creating clear height and volume at the front hairline (2–3 inches tall). " +
    "Sides are faded or tapered short. The quiff is well-defined and structured with a medium-hold product. " +
    "The lifted front volume against the short sides is the key feature.",

  side_part:
    BASE +
    "Hairstyle: classic side part. " +
    "A sharp, clean parting line on the left side of the head. Hair is combed neatly to each side of the part — flat and controlled. " +
    "Sides are slightly tapered but not faded. Natural or low-shine finish. " +
    "Professional, tidy, old-school gentleman look. No volume on top.",

  crew_cut:
    BASE +
    "Hairstyle: crew cut with low skin fade. " +
    "Sides and back faded to skin at the bottom, blending up. " +
    "Top is very short and flat (0.5–1 inch), slightly longer at the front hairline with no styling. " +
    "Clean, sharp, military-inspired look. No product, no texture — just close-cut uniformity on top.",

  buzz_cut:
    BASE +
    "Hairstyle: buzz cut. " +
    "Uniform very short length (3–6 mm, grade 1–2 clipper) all over the entire head including the sides and back. " +
    "No fade, no taper, no variation — same length everywhere. " +
    "Extremely minimal. The scalp is slightly visible through the hair.",

  wavy_fringe:
    BASE +
    "Hairstyle: natural wavy fringe. " +
    "Medium length on top (3–5 inches) with natural, loose waves and texture throughout — not styled, just air-dried. " +
    "The fringe falls casually over the forehead without any deliberate styling. " +
    "Sides are medium length too, not faded. Relaxed, natural, effortless look.",

  // ── Extended catalog ─────────────────────────────────────────────────────
  undercut:
    BASE +
    "Hairstyle: classic undercut. " +
    "All hair on the sides and back is shaved or clipped very short (grade 0–1), with a clearly defined disconnection line around the head. " +
    "The top is left long (3–5 inches), combed to one side or swept back. " +
    "The extreme contrast between the shaved sides and the long styled top is the defining feature.",

  wolf_cut:
    BASE +
    "Hairstyle: modern wolf cut. " +
    "Medium-long hair (4–6 inches on top) with heavy layers and a shaggy, textured look. " +
    "Curtain fringe falls across the forehead. Sides are slightly shorter but not faded — blended with layers. " +
    "The overall look is voluminous, effortless, and slightly messy, inspired by 1970s rock and K-pop aesthetics.",

  french_crop:
    BASE +
    "Hairstyle: French crop. " +
    "Short overall, sides tapered or mid-faded. Top is short (1–1.5 inches) with a blunt fringe sitting just above the forehead — " +
    "cut straight across, not swept to the side. The straight blunt fringe is the defining element. " +
    "Clean, minimal, European barbershop aesthetic.",

  edgar_cut:
    BASE +
    "Hairstyle: Edgar cut with mid fade. " +
    "Sides and back faded to skin (mid fade). Top is short (1–1.5 inches) with a completely straight, blunt horizontal fringe " +
    "cut right at the hairline. The blunt fringe and the faded sides are the two defining features. Clean and sharp.",

  middle_part:
    BASE +
    "Hairstyle: middle part. " +
    "Hair is parted exactly down the center of the head. Both sides fall symmetrically, slightly curved inward at the ends. " +
    "Length reaches the ears or slightly below — medium length. The style lies flat with a natural finish, no product. " +
    "Korean-inspired clean and effortless aesthetic.",

  taper_fade:
    BASE +
    "Hairstyle: taper fade. " +
    "Hair gradually fades from the natural hair length on top down to skin at the neckline and around the ears. " +
    "The fade is smooth and gradual — starts mid-temple, not a high skin fade. " +
    "Top is medium length (2–3 inches), natural unforced style. Classic barbershop finish.",

  modern_mullet:
    BASE +
    "Hairstyle: modern mullet. " +
    "Short on the front and sides (textured or slightly faded), but the back is left noticeably longer (3–4 inches past the collar). " +
    "The contrast between the short structured front and the longer flowing back is the key feature. " +
    "Textured and slightly messy on top. Contemporary version — not the retro exaggerated mullet.",

  faux_hawk:
    BASE +
    "Hairstyle: faux hawk. " +
    "Sides are faded or shaved short. The center strip of hair from front to crown is pushed upward, " +
    "creating a ridge of height (2–3 inches) down the middle of the head. Styled with product for hold. " +
    "The raised central strip contrasts sharply with the short sides.",

  disconnected_undercut:
    BASE +
    "Hairstyle: disconnected undercut. " +
    "Sides and back are shaved extremely close (skin or grade 0), with a sharp visible disconnection line — no blending, no fading, just a hard line. " +
    "The top is kept long (3–5 inches) and styled freely — swept back or to one side. " +
    "The harsh visible contrast line between shaved sides and long top is the signature feature.",

  low_fade_comb_over:
    BASE +
    "Hairstyle: comb over fade with low skin fade. " +
    "Sides fade from skin at the bottom up to natural length. Hair on top is combed to one side with a defined but soft parting. " +
    "Top length is medium (2–3 inches), lying flat and controlled. Medium shine finish. " +
    "Professional and sharp, modern barbershop look.",

  spiky_textured:
    BASE +
    "Hairstyle: spiky textured. " +
    "Short overall (1.5–2.5 inches on top). Hair on top is styled upward and outward into multiple short, irregular spikes using matte product. " +
    "No uniform direction — controlled chaos, multiple spike directions. Sides are slightly tapered. High energy, youthful look.",

  bro_flow:
    BASE +
    "Hairstyle: bro flow. " +
    "Medium-long hair (3–5 inches all over) allowed to grow naturally with minimal styling. " +
    "Hair flows back and to the sides from the forehead, falling around the ears and neck. " +
    "Natural, unstyled, air-dried texture. No fade, no taper — relaxed, flowing, athlete-inspired aesthetic.",

  korean_perm:
    BASE +
    "Hairstyle: Korean perm wave. " +
    "Medium length (3–5 inches on top). Hair has been permed to create soft, loose S-shaped waves — not tight curls, but gentle flowing waves throughout. " +
    "The texture is natural-looking, bouncy, and voluminous. Sides are not faded — medium length all around, blending into the wavy top. " +
    "Youthful K-pop aesthetic.",

  hard_part:
    BASE +
    "Hairstyle: hard part. " +
    "A razor-sharp shaved parting line on the left side of the head cuts cleanly through the hair. " +
    "Hair on top is combed neatly away from the parting. Sides are tapered or faded. " +
    "The razor-cut parting line is the defining feature — clean, geometric, and precisely defined. Medium shine finish.",

  high_skin_fade:
    BASE +
    "Hairstyle: high skin fade. " +
    "Skin fade starts high on the head — just above the temples, at the level where the head begins to curve. " +
    "Fades from completely bald at the sides up to the natural hair on top. " +
    "Top can be any medium length — the extreme high starting point of the fade is the defining feature. Clean, barbershop-sharp finish.",
};
