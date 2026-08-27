import type { Express, Request, Response } from "express";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_EDIT_SOURCE_BYTES = 16 * 1024 * 1024;
const BACKGROUND_PRESETS = new Set(["transparent", "#f4f1e8", "#ffffff", "#d9e9df", "#e84d31", "#17201f"]);
const EXPORT_SIZE_PRESETS = new Set(["original", "social-square", "social-portrait", "story", "product-square", "product-landscape"]);
const EXPORT_FORMATS = new Set(["png", "jpeg", "webp"]);
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type ImageUploadMetadata = {
  fileName: string;
  mimeType: string;
  byteLength: number;
};

export type UploadValidationResult =
  | { valid: true; extension: string }
  | { valid: false; message: string };

type EditOptions = {
  cropZoom: number;
  cropX: number;
  cropY: number;
  shadowEnabled: boolean;
  shadowOpacity: number;
  shadowBlur: number;
  shadowOffsetY: number;
  backgroundColor: string;
  exportSize: string;
  exportFormat: string;
  exportQuality: number;
};

type EditValidation =
  | { valid: true; options: EditOptions }
  | { valid: false; message: string };

export function validateImageUpload({
  fileName,
  mimeType,
  byteLength,
}: ImageUploadMetadata): UploadValidationResult {
  if (!fileName || !mimeType || !Number.isFinite(byteLength) || byteLength <= 0) {
    return { valid: false, message: "Choose a valid image file before processing." };
  }
  const extension = MIME_TO_EXTENSION[mimeType.toLowerCase()];
  if (!extension) return { valid: false, message: "Use a JPG, JPEG, PNG, or WebP image." };
  if (byteLength > MAX_UPLOAD_BYTES) return { valid: false, message: "Choose an image smaller than 8 MB." };
  return { valid: true, extension };
}

export function validateEditOptions(input: Partial<EditOptions>): EditValidation {
  const fields: Array<[keyof Omit<EditOptions, "shadowEnabled">, number, number]> = [
    ["cropZoom", 1, 1.8],
    ["cropX", -100, 100],
    ["cropY", -100, 100],
    ["shadowOpacity", 0, 100],
    ["shadowBlur", 0, 48],
    ["shadowOffsetY", -40, 64],
  ];
  for (const [field, min, max] of fields) {
    const value = input[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
      return { valid: false, message: "One of the edit controls is outside its supported range." };
    }
  }
  if (typeof input.shadowEnabled !== "boolean") {
    return { valid: false, message: "Choose whether to include a drop shadow." };
  }
  if (typeof input.backgroundColor !== "string" || (!BACKGROUND_PRESETS.has(input.backgroundColor) && !HEX_COLOR_PATTERN.test(input.backgroundColor))) {
    return { valid: false, message: "Choose a preset or valid six-digit hexadecimal background color." };
  }
  if (typeof input.exportSize !== "string" || !EXPORT_SIZE_PRESETS.has(input.exportSize)) {
    return { valid: false, message: "Choose one of the available export sizes." };
  }
  if (typeof input.exportFormat !== "string" || !EXPORT_FORMATS.has(input.exportFormat)) {
    return { valid: false, message: "Choose PNG, JPEG, or WebP for the export format." };
  }
  if (typeof input.exportQuality !== "number" || !Number.isFinite(input.exportQuality) || input.exportQuality < 40 || input.exportQuality > 100) {
    return { valid: false, message: "Choose an export quality between 40 and 100." };
  }
  return { valid: true, options: input as EditOptions };
}

function decodeDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  try {
    return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
  } catch {
    return null;
  }
}

function runPythonScript(script: string, args: string[], timeoutMs: number, message: string): Promise<void> {
  const python = process.env.PYTHON_BIN || "python3";
  return new Promise((resolve, reject) => {
    const child = spawn(python, [script, ...args], { cwd: process.cwd(), stdio: ["ignore", "ignore", "pipe"] });
    let errorOutput = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stderr.on("data", chunk => {
      errorOutput = `${errorOutput}${chunk.toString()}`.slice(-2_000);
    });
    child.once("error", error => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", code => {
      clearTimeout(timeout);
      if (code === 0) return resolve();
      reject(new Error(errorOutput || message));
    });
  });
}

function runBackgroundRemoval(inputPath: string, outputPath: string): Promise<void> {
  return runPythonScript("scripts/remove_background.py", [inputPath, outputPath], 150_000, "The image processor stopped before completing the image.");
}

function runImageAdjustment(inputPath: string, outputPath: string, options: EditOptions): Promise<void> {
  return runPythonScript(
    "scripts/edit_cutout.py",
    [
      inputPath,
      outputPath,
      String(options.cropZoom),
      String(options.cropX),
      String(options.cropY),
      options.shadowEnabled ? "1" : "0",
      String(options.shadowOpacity),
      String(options.shadowBlur),
      String(options.shadowOffsetY),
      options.backgroundColor,
      options.exportSize,
      options.exportFormat,
      String(options.exportQuality),
    ],
    90_000,
    "The image adjustment stopped before completing the result.",
  );
}

type RemoveBackgroundRequest = {
  fileName?: unknown;
  dataUrl?: unknown;
};

type EditCutoutRequest = {
  sourceUrl?: unknown;
  downloadName?: unknown;
  options?: unknown;
};

export function isSupportedResultSource(sourceUrl: string) {
  return sourceUrl.startsWith("/manus-storage/") || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(sourceUrl);
}

export function registerImageRemovalRoute(app: Express) {
  app.post("/api/remove-background", async (req: Request, res: Response) => {
    const { fileName, dataUrl } = req.body as RemoveBackgroundRequest;
    if (typeof fileName !== "string" || typeof dataUrl !== "string") {
      return res.status(400).json({ error: "Choose an image file before processing." });
    }
    const decoded = decodeDataUrl(dataUrl);
    if (!decoded) return res.status(400).json({ error: "The selected image could not be read." });
    const validation = validateImageUpload({ fileName, mimeType: decoded.mimeType, byteLength: decoded.buffer.byteLength });
    if (!validation.valid) return res.status(400).json({ error: validation.message });

    let workDir: string | undefined;
    try {
      workDir = await mkdtemp(path.join(tmpdir(), "clearcut-"));
      const inputPath = path.join(workDir, `source${validation.extension}`);
      const outputPath = path.join(workDir, "cutout.png");
      await writeFile(inputPath, decoded.buffer);
      await runBackgroundRemoval(inputPath, outputPath);
      const png = await readFile(outputPath);
      if (!png.byteLength) throw new Error("The image processor returned an empty result.");
      const { url } = await storagePut(`background-remover/${nanoid(16)}.png`, png, "image/png");
      const safeBaseName = path.basename(fileName, path.extname(fileName)).replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "background-removed";
      return res.status(200).json({ url, downloadName: `${safeBaseName}-transparent.png` });
    } catch (error) {
      console.error("[Background removal] Failed:", error);
      return res.status(500).json({ error: "We could not remove this background. Please try another image in a moment." });
    } finally {
      if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  });

  app.post("/api/edit-cutout", async (req: Request, res: Response) => {
    const { sourceUrl, downloadName, options } = req.body as EditCutoutRequest;
    if (typeof sourceUrl !== "string" || !isSupportedResultSource(sourceUrl) || typeof downloadName !== "string" || !options || typeof options !== "object") {
      return res.status(400).json({ error: "Choose a processed Clearcut image before refining it." });
    }
    const validation = validateEditOptions(options as Partial<EditOptions>);
    if (!validation.valid) return res.status(400).json({ error: validation.message });
    const host = req.get("host");
    if (!host) return res.status(500).json({ error: "The image editor could not establish a secure source URL." });

    let workDir: string | undefined;
    try {
      const remoteSource = sourceUrl.startsWith("data:") ? sourceUrl : new URL(sourceUrl, `${req.protocol}://${host}`);
      const sourceResponse = await fetch(remoteSource);
      if (!sourceResponse.ok) throw new Error(`Unable to retrieve processed image (${sourceResponse.status}).`);
      const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());
      if (!sourceBuffer.byteLength || sourceBuffer.byteLength > MAX_EDIT_SOURCE_BYTES) {
        return res.status(400).json({ error: "This processed image is too large to refine in the browser editor." });
      }
      workDir = await mkdtemp(path.join(tmpdir(), "clearcut-edit-"));
      const inputPath = path.join(workDir, "cutout-source.png");
      const outputPath = path.join(workDir, "cutout-refined.png");
      await writeFile(inputPath, sourceBuffer);
      await runImageAdjustment(inputPath, outputPath, validation.options);
      const png = await readFile(outputPath);
      if (!png.byteLength) throw new Error("The image editor returned an empty result.");
      const extension = validation.options.exportFormat === "jpeg" ? "jpg" : validation.options.exportFormat;
      const contentType = validation.options.exportFormat === "png" ? "image/png" : validation.options.exportFormat === "jpeg" ? "image/jpeg" : "image/webp";
      const { url } = await storagePut(`background-remover/${nanoid(16)}.${extension}`, png, contentType);
      const cleanName = downloadName.replace(/\.png$/i, "") || "background-removed";
      const suffix = validation.options.backgroundColor === "transparent" ? validation.options.exportSize : `${validation.options.exportSize}-background`;
      return res.status(200).json({ url, downloadName: `${cleanName}-${suffix}.${extension}` });
    } catch (error) {
      console.error("[Cutout edit] Failed:", error);
      return res.status(500).json({ error: "We could not apply those adjustments. Please try again." });
    } finally {
      if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  });
}
