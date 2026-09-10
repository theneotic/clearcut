import { validateClientImage } from "@/lib/imageUpload";
import { toggleAllBatchQueueItems, toggleBatchQueueItem } from "@/lib/batchQueue";
import { createBatchArchive } from "@/lib/batchArchive";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { appendHistoryItem, readProcessingHistory, renameHistoryItem, type ProcessingHistoryItem, writeProcessingHistory } from "@/lib/processingHistory";
import { EXPORT_FORMATS, EXPORT_SIZE_PRESETS, normalizeHexColor, type ExportFormat, type ExportSizePreset } from "@/lib/exportOptions";
import { parseApiResponse } from "@/lib/apiResponse";
import { HERO_AFTER_ARTWORK, HERO_BEFORE_ARTWORK } from "@/lib/heroArtwork";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CircleAlert,
  FileImage,
  ImagePlus,
  Loader2,
  RotateCcw,
  Scissors,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type ToolStatus = "idle" | "ready" | "processing" | "success" | "error";

const BACKGROUND_PRESETS = [
  { value: "transparent", label: "Transparent", swatch: "checkerboard" },
  { value: "#090d16", label: "Slate Canvas", swatch: "#090d16" },
  { value: "#101623", label: "Dark Card", swatch: "#101623" },
  { value: "#ffffff", label: "Pure White", swatch: "#ffffff" },
  { value: "#0284c7", label: "Sky Blue", swatch: "#0284c7" },
  { value: "#0f172a", label: "Deep Navy", swatch: "#0f172a" },
] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("background-removed-transparent.png");
  const [baseResultUrl, setBaseResultUrl] = useState<string | null>(null);
  const [baseDownloadName, setBaseDownloadName] = useState("background-removed-transparent.png");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<ProcessingHistoryItem[]>([]);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowOpacity, setShadowOpacity] = useState(45);
  const [shadowBlur, setShadowBlur] = useState(16);
  const [shadowOffsetY, setShadowOffsetY] = useState(14);
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [customHex, setCustomHex] = useState("");
  const [hexError, setHexError] = useState("");
  const [exportSize, setExportSize] = useState<ExportSizePreset>("original");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportQuality, setExportQuality] = useState(92);
  const [isRefining, setIsRefining] = useState(false);
  const [renamingHistoryId, setRenamingHistoryId] = useState<string | null>(null);
  const [historyLabelDraft, setHistoryLabelDraft] = useState("");
  const [batchQueueIds, setBatchQueueIds] = useState<Set<string>>(() => new Set());
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [batchMessage, setBatchMessage] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setHistory(readProcessingHistory());
  }, []);

  const saveToHistory = (url: string, name: string) => {
    const next = appendHistoryItem(history, {
      id: `${Date.now()}-${url}`,
      url,
      downloadName: name,
      label: name.replace(/\.[^.]+$/i, ""),
      createdAt: Date.now(),
    });
    setHistory(next);
    writeProcessingHistory(next);
  };

  const resetControls = () => {
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setShadowEnabled(false);
    setShadowOpacity(45);
    setShadowBlur(16);
    setShadowOffsetY(14);
    setBackgroundColor("transparent");
    setCustomHex("");
    setHexError("");
    setExportSize("original");
    setExportFormat("png");
    setExportQuality(92);
  };

  const selectFile = (file?: File) => {
    if (!file) return;
    const validationMessage = validateClientImage(file);
    if (validationMessage) {
      setError(validationMessage);
      setStatus("error");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setBaseResultUrl(null);
    setError("");
    resetControls();
    setStatus("ready");
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0]);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const removeBackground = async () => {
    if (!selectedFile) return;
    setStatus("processing");
    setError("");
    try {
      const dataUrl = await readAsDataUrl(selectedFile);
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: selectedFile.name, dataUrl }),
      });
      const payload = await parseApiResponse<{ url?: string; downloadName?: string; error?: string }>(response);
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "We could not remove this background. Please try again.");
      }
      setResultUrl(payload.url);
      setDownloadName(payload.downloadName || "background-removed-transparent.png");
      setBaseResultUrl(payload.url);
      setBaseDownloadName(payload.downloadName || "background-removed-transparent.png");
      saveToHistory(payload.url, payload.downloadName || "background-removed-transparent.png");
      setStatus("success");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setBaseResultUrl(null);
    setError("");
    resetControls();
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const resetAppliedEdits = () => {
    if (baseResultUrl) {
      setResultUrl(baseResultUrl);
      setDownloadName(baseDownloadName);
    }
    resetControls();
    setError("");
  };

  const applyCustomHex = () => {
    const normalized = normalizeHexColor(customHex);
    if (!normalized) {
      setHexError("Enter a 3- or 6-digit hex value, for example #38bdf8.");
      return;
    }
    setBackgroundColor(normalized);
    setCustomHex(normalized);
    setHexError("");
  };

  const duplicateWithNewBackground = (item: ProcessingHistoryItem) => {
    setBaseResultUrl(item.url);
    setBaseDownloadName(item.downloadName);
    setResultUrl(item.url);
    setDownloadName(item.downloadName);
    setPreviewUrl(item.url);
    setSelectedFile(null);
    resetControls();
    setStatus("success");
    setError("");
    window.setTimeout(() => document.getElementById("output")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const startRename = (item: ProcessingHistoryItem) => {
    setRenamingHistoryId(item.id);
    setHistoryLabelDraft(item.label);
  };

  const saveRename = (id: string) => {
    const next = renameHistoryItem(history, id, historyLabelDraft);
    setHistory(next);
    writeProcessingHistory(next);
    setRenamingHistoryId(null);
  };

  const toggleBatchItem = (id: string) => {
    setBatchQueueIds(current => toggleBatchQueueItem(current, id));
    setBatchMessage("");
  };

  const toggleAllBatchItems = () => {
    setBatchQueueIds(current => toggleAllBatchQueueItems(current, history.map(item => item.id)));
    setBatchMessage("");
  };

  const downloadBatch = async () => {
    const selected = history.filter(item => batchQueueIds.has(item.id));
    if (!selected.length || isBatchExporting) return;
    setIsBatchExporting(true);
    setBatchMessage("");
    try {
      const files = await Promise.all(selected.map(async item => {
        const response = await fetch(item.url);
        if (!response.ok) throw new Error(`Unable to retrieve ${item.label}.`);
        return { name: item.downloadName, blob: await response.blob() };
      }));
      const blob = await createBatchArchive(files);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `clearcut-batch-${selected.length}-items.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setBatchMessage(`Downloaded ${selected.length} ${selected.length === 1 ? "file" : "files"} as a ZIP.`);
      setBatchQueueIds(new Set());
    } catch (caughtError) {
      setBatchMessage(caughtError instanceof Error ? caughtError.message : "The batch could not be prepared. Please try again.");
    } finally {
      setIsBatchExporting(false);
    }
  };

  const applyRefinements = async () => {
    if (!resultUrl || isRefining) return;
    setIsRefining(true);
    setError("");
    try {
      const response = await fetch("/api/edit-cutout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: baseResultUrl || resultUrl,
          downloadName: baseDownloadName || downloadName,
          options: { cropZoom, cropX, cropY, shadowEnabled, shadowOpacity, shadowBlur, shadowOffsetY, backgroundColor, exportSize, exportFormat, exportQuality },
        }),
      });
      const payload = await parseApiResponse<{ url?: string; downloadName?: string; error?: string }>(response);
      if (!response.ok || !payload.url) throw new Error(payload.error || "We could not apply those adjustments.");
      const nextName = payload.downloadName || "background-removed-refined.png";
      setResultUrl(payload.url);
      setDownloadName(nextName);
      saveToHistory(payload.url, nextName);
      resetControls();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong while refining the cutout.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      <PublicHeader />

      <main id="top">
        {/* Hero Section */}
        <section className="container grid min-h-[580px] grid-cols-1 border-x border-slate-800/80 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between border-b border-slate-800/80 px-2 pb-8 pt-10 sm:px-8 sm:pb-12 sm:pt-16 lg:border-b-0 lg:border-r">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-sky-400">
                <span className="size-1.5 rounded-full bg-sky-400"></span>
                <span>Automated Subject Isolation</span>
              </div>
              <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                Cut away the noise.<br />
                <span className="text-sky-400">Keep the subject.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-slate-400">
                An engineering-grade utility to separate subjects from complex backgrounds. Import any photo, inspect the alpha channel, and export lossless transparent PNGs in seconds.
              </p>
            </div>
            <div className="mt-10 grid gap-4 border-t border-slate-800/80 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Supported Inputs: JPG / PNG / WebP
                </p>
                <p className="font-mono text-[10px] text-slate-400 mt-1">
                  Full Alpha Transparency / Zero Compression Loss
                </p>
              </div>
              <a
                href="#studio"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate-950 transition hover:bg-sky-400 shadow-lg shadow-sky-500/10"
              >
                Open Studio <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>

          <div className="cut-grid relative min-h-[420px] overflow-hidden p-6 sm:p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#101623]/80 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs font-mono text-slate-300">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-sky-400"></span>
                Live Edge Preview
              </span>
              <span className="text-slate-400">00:02 Average Processing</span>
            </div>

            <div className="relative my-auto grid h-[320px] max-w-[500px] grid-cols-[1.05fr_0.95fr] items-center gap-0 mx-auto w-full">
              <figure className="relative z-10 h-[85%] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
                <img src={HERO_BEFORE_ARTWORK} alt="Original portrait with studio backdrop" className="size-full object-cover object-center" />
                <figcaption className="absolute bottom-2 left-2 rounded-md bg-slate-950/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-300 border border-slate-800">
                  Original
                </figcaption>
              </figure>
              <figure className="checkerboard relative z-20 -ml-6 h-full overflow-hidden rounded-xl border border-sky-500/50 bg-[#090d16] shadow-2xl shadow-sky-500/10">
                <img src={HERO_AFTER_ARTWORK} alt="Cutout on dark transparency grid" className="size-full object-contain p-3" />
                <figcaption className="absolute bottom-2 right-2 rounded-md bg-sky-500 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-950 font-bold">
                  Alpha Cutout
                </figcaption>
              </figure>
              <span className="absolute left-[46%] top-1/2 z-30 grid size-10 -translate-y-1/2 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-sky-400 shadow-xl">
                <Scissors className="size-4.5" />
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono text-[11px] text-slate-400">
              <span>Foreground: 100% retained</span>
              <span>Output: Clean Alpha Matte</span>
            </div>
          </div>
        </section>

        {/* Studio Workspace Section */}
        <section id="studio" className="border-y border-slate-800/80 bg-[#0b101c] py-12 text-slate-100">
          <div className="container grid gap-8 border-x border-slate-800/80 lg:grid-cols-[0.32fr_0.68fr] lg:gap-10">
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-sky-400">
                  <SlidersHorizontal className="size-3.5" />
                  <span>Studio Console</span>
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Upload Image.<br />
                  <span className="text-slate-400">Extract Subject.</span>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Select or drag an image into the studio. Our automated segmentation engine isolates the foreground subject and preserves hair, transparent fabric, and edge detail.
                </p>
              </div>

              <div className="mt-8 rounded-xl border border-slate-800 bg-[#101623] p-4 text-xs font-mono text-slate-400 space-y-2.5">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span>Max File Size</span>
                  <span className="text-slate-200">8 MB</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span>Accepted Formats</span>
                  <span className="text-slate-200">JPG, PNG, WebP</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Location</span>
                  <span className="text-slate-200">Local Temporary Buffer</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#101623] p-4 sm:p-6 shadow-2xl relative">
              <input
                ref={inputRef}
                id="image-file"
                className="sr-only"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleInput}
              />

              {/* Upload Dropzone */}
              {(status === "idle" || status === "error") && (
                <div
                  className={`relative grid min-h-[360px] place-items-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? "border-sky-400 bg-sky-500/5"
                      : status === "error"
                      ? "border-rose-500/50 bg-rose-500/5"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                  }`}
                  onDragEnter={event => { event.preventDefault(); setIsDragging(true); }}
                  onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={event => { event.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                >
                  <div className="relative max-w-sm">
                    <div className={`mx-auto grid size-14 place-items-center rounded-2xl border ${status === "error" ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-slate-700 bg-slate-900 text-sky-400"}`}>
                      {status === "error" ? <CircleAlert className="size-6" /> : <ImagePlus className="size-6" />}
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-white tracking-tight">
                      {status === "error" ? "Upload Failed" : "Drop your image here"}
                    </h3>
                    <p className={`mt-2 text-xs leading-relaxed ${status === "error" ? "text-rose-300" : "text-slate-400"}`}>
                      {status === "error" ? error : "Drag & drop your file or click the button below. JPG, PNG, and WebP supported up to 8 MB."}
                    </p>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-100 transition hover:bg-slate-800 hover:border-sky-500"
                    >
                      <Upload className="size-3.5 text-sky-400" /> Select Image
                    </button>
                  </div>
                </div>
              )}

              {/* Ready / Processing Stage */}
              {status !== "idle" && status !== "error" && previewUrl && (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="relative min-h-[340px] overflow-hidden rounded-xl border border-slate-800 bg-[#090d16] flex items-center justify-center p-4">
                    <img src={previewUrl} alt="Selected source image" className="max-h-[320px] max-w-full object-contain" />
                    <span className="absolute left-3 top-3 rounded-md bg-slate-900/90 border border-slate-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-300">
                      Original: {selectedFile && formatBytes(selectedFile.size)}
                    </span>
                    <button
                      type="button"
                      onClick={reset}
                      className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-600 transition"
                      aria-label="Choose another image"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  </div>

                  <div className="flex min-h-[260px] flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div>
                      <div className="flex items-center gap-2 text-sky-400">
                        <FileImage className="size-4" />
                        <span className="font-mono text-xs font-semibold uppercase tracking-wider">File Selected</span>
                      </div>
                      <p className="mt-3 break-all font-mono text-xs text-slate-200">
                        {selectedFile?.name}
                      </p>

                      {status === "processing" ? (
                        <div aria-live="polite" className="mt-5 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">
                          <span className="flex items-center gap-2 font-mono font-semibold uppercase tracking-wider text-sky-400">
                            <Loader2 className="size-3.5 animate-spin" /> Isolating subject
                          </span>
                          <p className="mt-1 text-[11px] text-slate-400">Computing edge gradients & alpha transparency mask...</p>
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                          Ready to process. The engine will extract the subject and generate a clean alpha mask.
                        </p>
                      )}
                    </div>

                    <div className="mt-6 space-y-2">
                      <button
                        type="button"
                        disabled={status === "processing"}
                        onClick={removeBackground}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-950 transition hover:bg-sky-400 disabled:opacity-50 shadow-md shadow-sky-500/10"
                      >
                        {status === "processing" ? "Processing..." : "Remove Background"}
                        <ArrowRight className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={status === "processing"}
                        onClick={reset}
                        className="w-full text-center font-mono text-[11px] uppercase tracking-wider text-slate-400 hover:text-white transition disabled:opacity-40"
                      >
                        Cancel & Replace
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Result & Refinement Desk */}
              {status === "success" && resultUrl && previewUrl && (
                <div id="output" className="mt-5 rounded-xl border border-slate-800 bg-[#090d16] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      <span className="grid size-5 place-items-center rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Check className="size-3.5" />
                      </span>
                      <span>Cutout Complete</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={resetAppliedEdits}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-slate-600 hover:text-white"
                      >
                        Reset Controls
                      </button>
                      <a
                        href={resultUrl}
                        download={downloadName}
                        className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-950 transition hover:bg-sky-400 shadow-md shadow-sky-500/10"
                      >
                        <ArrowDownRight className="size-3.5" /> Download PNG
                      </a>
                    </div>
                  </div>

                  {/* Visual Comparison */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <figure className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                      <figcaption className="border-b border-slate-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                        {previewUrl === baseResultUrl ? "Source Cutout" : "Original Image"}
                      </figcaption>
                      <div className="h-52 p-3 flex items-center justify-center">
                        <img src={previewUrl} alt="Original upload or selected cutout" className="max-h-full max-w-full object-contain" />
                      </div>
                    </figure>

                    <figure className="rounded-xl border border-sky-500/40 bg-slate-900/60 overflow-hidden shadow-lg shadow-sky-500/5">
                      <figcaption className="border-b border-slate-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-sky-400">
                        Export Preview (Alpha Result)
                      </figcaption>
                      <div
                        className={`h-52 overflow-hidden p-3 flex items-center justify-center ${backgroundColor === "transparent" ? "checkerboard" : ""}`}
                        style={{ backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor }}
                      >
                        <img
                          src={resultUrl}
                          alt="Background removed result"
                          className="max-h-full max-w-full object-contain transition-transform duration-200"
                          style={{
                            transform: `scale(${cropZoom}) translate(${cropX / 5}px, ${cropY / 5}px)`,
                            filter: shadowEnabled ? `drop-shadow(0 ${shadowOffsetY / 2}px ${shadowBlur / 3}px rgba(0, 0, 0, ${shadowOpacity / 100}))` : undefined,
                          }}
                        />
                      </div>
                    </figure>
                  </div>

                  {/* Refinement Controls */}
                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
                      <SlidersHorizontal className="size-3.5 text-sky-400" />
                      <span>Fine-Tune & Custom Export</span>
                    </p>

                    <div className="grid gap-6 md:grid-cols-3">
                      {/* Framing & Crop */}
                      <div className="rounded-xl border border-slate-800 bg-[#101623] p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300">Zoom & Pan</span>
                          <button
                            type="button"
                            onClick={() => { setCropZoom(1); setCropX(0); setCropY(0); }}
                            className="font-mono text-[10px] text-slate-400 hover:text-sky-400 transition"
                          >
                            Reset
                          </button>
                        </div>
                        <label className="mt-3 block font-mono text-[10px] uppercase text-slate-400">
                          Zoom: <span className="text-slate-200">{cropZoom.toFixed(2)}×</span>
                          <input
                            aria-label="Crop zoom"
                            className="mt-1.5 block w-full accent-sky-400"
                            type="range"
                            min="1"
                            max="1.8"
                            step="0.01"
                            value={cropZoom}
                            onChange={event => setCropZoom(Number(event.target.value))}
                          />
                        </label>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <label className="font-mono text-[10px] uppercase text-slate-400">
                            Offset X: <span className="text-slate-200">{cropX}</span>
                            <input
                              aria-label="Crop horizontal position"
                              className="mt-1 block w-full accent-sky-400"
                              type="range"
                              min="-100"
                              max="100"
                              value={cropX}
                              onChange={event => setCropX(Number(event.target.value))}
                            />
                          </label>
                          <label className="font-mono text-[10px] uppercase text-slate-400">
                            Offset Y: <span className="text-slate-200">{cropY}</span>
                            <input
                              aria-label="Crop vertical position"
                              className="mt-1 block w-full accent-sky-400"
                              type="range"
                              min="-100"
                              max="100"
                              value={cropY}
                              onChange={event => setCropY(Number(event.target.value))}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Drop Shadow */}
                      <div className="rounded-xl border border-slate-800 bg-[#101623] p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300">Drop Shadow</span>
                          <button
                            type="button"
                            onClick={() => setShadowEnabled(value => !value)}
                            className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border transition ${
                              shadowEnabled ? "border-sky-500 bg-sky-500/20 text-sky-400" : "border-slate-700 bg-slate-900 text-slate-400"
                            }`}
                          >
                            {shadowEnabled ? "Enabled" : "Disabled"}
                          </button>
                        </div>
                        <div className={`mt-3 space-y-2.5 transition-opacity ${shadowEnabled ? "opacity-100" : "pointer-events-none opacity-30"}`}>
                          <label className="block font-mono text-[10px] uppercase text-slate-400">
                            Opacity: <span className="text-slate-200">{shadowOpacity}%</span>
                            <input
                              aria-label="Shadow opacity"
                              className="mt-1 block w-full accent-sky-400"
                              type="range"
                              min="0"
                              max="100"
                              value={shadowOpacity}
                              onChange={event => setShadowOpacity(Number(event.target.value))}
                            />
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="font-mono text-[10px] uppercase text-slate-400">
                              Blur: <span className="text-slate-200">{shadowBlur}px</span>
                              <input
                                aria-label="Shadow blur"
                                className="mt-1 block w-full accent-sky-400"
                                type="range"
                                min="0"
                                max="48"
                                value={shadowBlur}
                                onChange={event => setShadowBlur(Number(event.target.value))}
                              />
                            </label>
                            <label className="font-mono text-[10px] uppercase text-slate-400">
                              Offset Y: <span className="text-slate-200">{shadowOffsetY}px</span>
                              <input
                                aria-label="Shadow vertical offset"
                                className="mt-1 block w-full accent-sky-400"
                                type="range"
                                min="-40"
                                max="64"
                                value={shadowOffsetY}
                                onChange={event => setShadowOffsetY(Number(event.target.value))}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Background Color Matting */}
                      <div className="rounded-xl border border-slate-800 bg-[#101623] p-3.5">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 block">
                          Matte Background
                        </span>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {BACKGROUND_PRESETS.map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => { setBackgroundColor(preset.value); setHexError(""); }}
                              title={preset.label}
                              aria-label={`${preset.label} background`}
                              className={`grid size-7 place-items-center rounded-lg border transition ${
                                backgroundColor === preset.value
                                  ? "border-sky-400 ring-2 ring-sky-400/30"
                                  : "border-slate-700 hover:border-slate-500"
                              }`}
                            >
                              {preset.value === "transparent" ? (
                                <span className="checkerboard size-4.5 rounded border border-slate-600" />
                              ) : (
                                <span className="size-4.5 rounded border border-black/20" style={{ backgroundColor: preset.swatch }} />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-1.5">
                          <label className="sr-only" htmlFor="custom-background-color">Custom Hex Color</label>
                          <input
                            id="custom-background-color"
                            value={customHex}
                            onChange={event => setCustomHex(event.target.value)}
                            onKeyDown={event => { if (event.key === "Enter") applyCustomHex(); }}
                            placeholder="#090d16"
                            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs uppercase text-slate-200 outline-none focus:border-sky-400"
                          />
                          <button
                            type="button"
                            onClick={applyCustomHex}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-3 font-mono text-[10px] uppercase tracking-wider text-slate-200 hover:border-sky-500 hover:text-sky-400"
                          >
                            Set
                          </button>
                        </div>
                        {hexError && <p className="mt-1.5 text-xs text-rose-400">{hexError}</p>}
                      </div>
                    </div>

                    {/* Export Size & Format */}
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-[#101623] p-3.5">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 block mb-2.5">
                          Output Canvas Preset
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {EXPORT_SIZE_PRESETS.map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setExportSize(preset.value)}
                              className={`rounded-lg border px-2.5 py-2 text-left transition ${
                                exportSize === preset.value
                                  ? "border-sky-500/80 bg-sky-500/10 text-white"
                                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                              }`}
                            >
                              <span className="block font-mono text-[10px] font-semibold uppercase">{preset.label}</span>
                              <span className="mt-0.5 block font-mono text-[9px] text-slate-400">{preset.detail}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-[#101623] p-3.5">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 block mb-2.5">
                          Export Encoding Format
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {EXPORT_FORMATS.map(format => (
                            <button
                              key={format.value}
                              type="button"
                              onClick={() => setExportFormat(format.value)}
                              className={`rounded-lg border px-2.5 py-2 text-left transition ${
                                exportFormat === format.value
                                  ? "border-sky-500/80 bg-sky-500/10 text-white"
                                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                              }`}
                            >
                              <span className="block font-mono text-[10px] font-semibold uppercase">{format.label}</span>
                              <span className="mt-0.5 block font-mono text-[9px] text-slate-400">{format.detail}</span>
                            </button>
                          ))}
                        </div>

                        {exportFormat === "png" ? (
                          <p className="mt-3 font-mono text-[10px] text-slate-400">
                            PNG preserves transparent alpha lossless encoding.
                          </p>
                        ) : (
                          <label className="mt-2.5 block font-mono text-[10px] uppercase text-slate-400">
                            Quality: <span className="text-slate-200">{exportQuality}%</span>
                            <input
                              aria-label="Export quality"
                              className="mt-1 block w-full accent-sky-400"
                              type="range"
                              min="40"
                              max="100"
                              value={exportQuality}
                              onChange={event => setExportQuality(Number(event.target.value))}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={applyRefinements}
                        disabled={isRefining}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-950 transition hover:bg-sky-400 disabled:opacity-60 shadow-md shadow-sky-500/10"
                      >
                        {isRefining ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>Applying Adjustments...</span>
                          </>
                        ) : (
                          <>
                            <span>Save Refinements</span>
                            <ArrowRight className="size-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                    {error && (
                      <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300" role="alert">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Local History & Batch Export */}
        <section className="border-b border-slate-800/80 bg-[#090d16] py-12">
          <div className="container border-x border-slate-800/80">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-sky-400">
                  Local Session History
                </p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Recent Cutouts
                </h2>
              </div>
              <div className="max-w-md">
                <p className="font-mono text-[11px] leading-relaxed text-slate-400">
                  Stored securely in your local browser cache for immediate retrieval. No cloud storage needed.
                </p>
                {history.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleAllBatchItems}
                      className="font-mono text-xs uppercase tracking-wider text-slate-400 hover:text-sky-400 transition"
                    >
                      {batchQueueIds.size === history.length ? "Deselect All" : "Select All"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadBatch}
                      disabled={!batchQueueIds.size || isBatchExporting}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 font-mono text-xs font-semibold text-slate-200 transition disabled:opacity-40"
                    >
                      {isBatchExporting ? "Archiving ZIP..." : `Download Selected (${batchQueueIds.size})`}
                    </button>
                  </div>
                )}
                {batchMessage && (
                  <p className="mt-2 font-mono text-xs text-sky-400" role="status">
                    {batchMessage}
                  </p>
                )}
              </div>
            </div>

            {history.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {history.map((item, index) => (
                  <article
                    key={item.id}
                    className={`relative flex items-center gap-3.5 rounded-xl border p-3.5 transition ${
                      batchQueueIds.has(item.id)
                        ? "border-sky-400/80 bg-sky-500/5 ring-1 ring-sky-400/30"
                        : "border-slate-800 bg-[#101623] hover:border-slate-700"
                    }`}
                  >
                    <label className="absolute right-3 top-3 flex items-center gap-1.5 font-mono text-[10px] uppercase text-slate-400 cursor-pointer">
                      <input
                        aria-label={`Select ${item.label} for batch download`}
                        type="checkbox"
                        checked={batchQueueIds.has(item.id)}
                        onChange={() => toggleBatchItem(item.id)}
                        className="accent-sky-400"
                      />
                      <span>Queue</span>
                    </label>

                    <div className="checkerboard grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-800">
                      <img src={item.url} alt="Processed transparent thumbnail" className="size-full object-contain p-1" />
                    </div>

                    <div className="min-w-0 flex-1 pr-10">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-sky-400">
                        Asset #{String(index + 1).padStart(2, "0")}
                      </p>

                      {renamingHistoryId === item.id ? (
                        <div className="mt-1 flex gap-1">
                          <input
                            aria-label="History entry label"
                            className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-white outline-none focus:border-sky-400"
                            value={historyLabelDraft}
                            onChange={event => setHistoryLabelDraft(event.target.value)}
                            onKeyDown={event => {
                              if (event.key === "Enter") saveRename(item.id);
                              if (event.key === "Escape") setRenamingHistoryId(null);
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveRename(item.id)}
                            className="rounded bg-sky-500 px-2 font-mono text-[10px] font-semibold text-slate-950 hover:bg-sky-400"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="min-w-0 truncate text-sm font-semibold text-white">
                            {item.label}
                          </p>
                          <button
                            type="button"
                            onClick={() => startRename(item)}
                            className="font-mono text-[10px] text-slate-400 hover:text-sky-400"
                          >
                            Edit
                          </button>
                        </div>
                      )}

                      <p className="mt-1 font-mono text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px]">
                        <a
                          href={item.url}
                          download={item.downloadName}
                          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                        >
                          Download <ArrowDownRight className="size-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => duplicateWithNewBackground(item)}
                          className="text-slate-400 hover:text-white transition"
                        >
                          Duplicate + Edit
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-800 p-8 text-center font-mono text-xs uppercase tracking-wider text-slate-400">
                No past cutouts found in this session. Process an image above to populate local history.
              </div>
            )}
          </div>
        </section>

        {/* Methodology / How It Works */}
        <section id="how-it-works" className="container border-x border-slate-800/80 py-16 sm:py-20">
          <div className="mb-10 grid gap-6 border-b border-slate-800 pb-8 lg:grid-cols-[1fr_0.6fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-sky-400">
                <span>Architecture</span>
              </div>
              <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white tracking-tight">
                Deterministic separation.<br />
                <span className="text-slate-400">Lossless export pipeline.</span>
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-400">
              Engineered for production graphic designers, eCommerce merchants, and developers who need clean, dependable transparent PNGs with zero hassle.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload & Ingest",
                description: "Drop JPG, PNG, or WebP formats up to 8 MB. Files are ingested into a secure, volatile memory buffer without telemetry.",
              },
              {
                step: "02",
                title: "Neural Segmentation",
                description: "Deep learning models compute high-resolution foreground probability masks, isolating complex fine details like hair.",
              },
              {
                step: "03",
                title: "Format & Download",
                description: "Apply shadows, color mattes, framing transforms, and export lossless transparent PNG or optimized WebP assets.",
              },
            ].map(({ step, title, description }) => (
              <article key={step} className="rounded-xl border border-slate-800 bg-[#101623] p-6 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-sky-400">
                    Step {step}
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
