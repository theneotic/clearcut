export const EXPORT_SIZE_PRESETS = [
  { value: "original", label: "Original", detail: "Keep source canvas", width: null, height: null },
  { value: "social-square", label: "Social square", detail: "1080 × 1080", width: 1080, height: 1080 },
  { value: "social-portrait", label: "Social portrait", detail: "1080 × 1350", width: 1080, height: 1350 },
  { value: "story", label: "Story", detail: "1080 × 1920", width: 1080, height: 1920 },
  { value: "product-square", label: "Product square", detail: "1600 × 1600", width: 1600, height: 1600 },
  { value: "product-landscape", label: "Product landscape", detail: "2000 × 1333", width: 2000, height: 1333 },
] as const;

export type ExportSizePreset = (typeof EXPORT_SIZE_PRESETS)[number]["value"];

export const EXPORT_FORMATS = [
  { value: "png", label: "PNG", detail: "Alpha-safe / lossless" },
  { value: "jpeg", label: "JPEG", detail: "White matte if transparent" },
  { value: "webp", label: "WebP", detail: "Compact / alpha-safe" },
] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number]["value"];

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return null;
  const expanded = trimmed.length === 3 ? trimmed.split("").map(character => `${character}${character}`).join("") : trimmed;
  return `#${expanded.toLowerCase()}`;
}
