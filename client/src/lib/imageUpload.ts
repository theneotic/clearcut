export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function validateClientImage(file: Pick<File, "type" | "size">): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "Use a JPG, JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "Choose an image smaller than 8 MB.";
  }

  return null;
}
