export const STYLES = [
  { id: "textured_crop",  name: "Textured Crop",   tag: "MID FADE",     hue: 292 },
  { id: "side_part",      name: "Side Part",        tag: "CLASSIC",      hue: 278 },
  { id: "pompadour",      name: "Pompadour",        tag: "HIGH VOLUME",  hue: 312 },
  { id: "curtain_fringe", name: "Curtain Fringe",   tag: "SOFT",         hue: 330 },
  { id: "buzz_cut",       name: "Buzz Cut",         tag: "CLEAN",        hue: 260 },
  { id: "slick_back",     name: "Slick Back",       tag: "SHARP",        hue: 300 },
  { id: "quiff",          name: "Quiff",            tag: "MODERN",       hue: 286 },
  { id: "crew_cut",       name: "Crew Cut",         tag: "LOW TAPER",    hue: 24  },
  { id: "wavy_fringe",    name: "Wavy Fringe",      tag: "NATURAL",      hue: 350 },
  { id: "comma_hair",     name: "Comma Hair",       tag: "KOREAN",       hue: 270 },
] as const;

export type StyleItem = (typeof STYLES)[number];

export function stripeBg(hue: number) {
  return `repeating-linear-gradient(135deg, oklch(0.27 0.06 ${hue}), oklch(0.27 0.06 ${hue}) 9px, oklch(0.33 0.085 ${hue}) 9px, oklch(0.33 0.085 ${hue}) 18px)`;
}

export function stripeBgLight(hue: number) {
  return `repeating-linear-gradient(135deg, oklch(0.93 0.035 ${hue}), oklch(0.93 0.035 ${hue}) 9px, oklch(0.88 0.05 ${hue}) 9px, oklch(0.88 0.05 ${hue}) 18px)`;
}

// Prompts sent to gpt-image-1 for each hairstyle
export const STYLE_PROMPTS: Record<string, string> = {
  textured_crop:
    "Restyle this person's hair into a textured crop with a clean mid fade. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  side_part:
    "Restyle this person's hair into a classic side part with slicked styling. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  pompadour:
    "Restyle this person's hair into a modern pompadour with high volume swept back on top and faded sides. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  curtain_fringe:
    "Restyle this person's hair into curtain fringe — soft bangs parted in the middle with medium length. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  buzz_cut:
    "Restyle this person's hair into a clean buzz cut, very short and uniform all over. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  slick_back:
    "Restyle this person's hair into a slick back style, combed straight back with a high-shine finish. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  quiff:
    "Restyle this person's hair into a modern quiff with voluminous front swept upward and back. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  crew_cut:
    "Restyle this person's hair into a crew cut with a low taper fade, short and neat. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  wavy_fringe:
    "Restyle this person's hair into natural wavy hair with a casual fringe falling forward over the forehead. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
  comma_hair:
    "Restyle this person's hair into Korean comma hair (쉼표 머리) with a distinctive S-curl and comma-shaped parting. Keep the face, skin tone, and all facial features completely unchanged. Only modify the hair.",
};
