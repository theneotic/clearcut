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
  { value: "transparent", label: "Clear", swatch: "checkerboard" },
  { value: "#f4f1e8", label: "Paper", swatch: "#f4f1e8" },
  { value: "#ffffff", label: "White", swatch: "#ffffff" },
  { value: "#d9e9df", label: "Mint", swatch: "#d9e9df" },
  { value: "#e84d31", label: "Signal", swatch: "#e84d31" },
  { value: "#17201f", label: "Ink", swatch: "#17201f" },
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
      setHexError("Enter a 3- or 6-digit hex value, for example #e84d31.");
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
    <div className="min-h-screen bg-[#f4f1e8] text-[#17201f]">
      <PublicHeader />

      <main id="top">
        <section className="container grid min-h-[610px] grid-cols-1 border-x border-[#17201f] lg:grid-cols-[1.06fr_0.94fr]">
          <div className="flex flex-col justify-between border-b border-[#17201f] px-1 pb-8 pt-9 sm:px-7 sm:pb-10 sm:pt-14 lg:border-b-0 lg:border-r">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e84d31]">A background-removal desk / 01</p>
              <h1 className="font-display mt-8 max-w-[650px] text-[clamp(3.7rem,8vw,7.7rem)] font-semibold leading-[0.83] tracking-[-0.085em] text-[#17201f]">
                Cut away<br />the ordinary.
              </h1>
              <p className="mt-10 max-w-md text-base leading-7 text-[#43504c] sm:text-lg">A deliberate, no-friction way to separate your subject from its surroundings. Bring the image. Leave with transparent pixels.</p>
            </div>
            <div className="mt-10 grid gap-4 border-t border-[#17201f] pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="max-w-xs font-mono text-[10px] leading-5 uppercase tracking-[0.11em] text-[#52605b]">JPG / PNG / WEBP<br />TRANSPARENT PNG ON EXIT</p>
              <a href="#studio" className="group inline-flex items-center justify-between bg-[#17201f] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#f4f1e8] transition hover:bg-[#e84d31] sm:min-w-52">Start a cutout <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" /></a>
            </div>
          </div>

          <div className="cut-grid relative min-h-[440px] overflow-hidden px-5 py-6 sm:p-9">
            <div className="absolute left-0 top-0 h-16 w-full border-b border-[#17201f] bg-[#f4f1e8]/85 px-5 py-5 font-mono text-[10px] uppercase tracking-[0.12em] sm:px-9">CUTTING ROOM / REAL PROOF</div>
            <div className="relative mt-16 grid h-[330px] max-w-[540px] grid-cols-[1.04fr_0.96fr] items-center gap-0 sm:mx-auto sm:h-[350px]">
              <figure className="relative z-10 h-[82%] overflow-hidden border border-[#17201f] bg-[#d7e3df] shadow-[10px_10px_0_#17201f]">
                <img src={HERO_BEFORE_ARTWORK} alt="Original portrait with blue background" className="size-full object-cover object-center" />
                <figcaption className="absolute bottom-0 left-0 bg-[#f4f1e8] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]">Before / full frame</figcaption>
              </figure>
              <figure className="checkerboard relative z-20 -ml-4 h-full border border-[#17201f] bg-[#f4f1e8] shadow-[10px_10px_0_#e84d31] sm:-ml-8">
                <img src={HERO_AFTER_ARTWORK} alt="Portrait after background removal on a transparency grid" className="size-full object-contain p-3" />
                <figcaption className="absolute bottom-0 right-0 bg-[#e84d31] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]">After / alpha</figcaption>
              </figure>
              <span className="absolute left-[45%] top-1/2 z-30 grid size-9 -translate-y-1/2 place-items-center border border-[#17201f] bg-[#f4f1e8] text-[#17201f]"><Scissors className="size-4" /></span>
            </div>
            <div className="absolute bottom-7 left-5 right-5 flex items-end justify-between border-t border-[#17201f] pt-3 font-mono text-[10px] uppercase tracking-[0.11em] sm:bottom-9 sm:left-9 sm:right-9">
              <span>Foreground / retained</span><span>Actual cutout / 00:03</span>
            </div>
          </div>
        </section>

        <section id="studio" className="border-y border-[#17201f] bg-[#17201f] py-1 text-[#f4f1e8]">
          <div className="container grid gap-8 border-x border-[#60716a] py-8 sm:py-12 lg:grid-cols-[0.36fr_0.64fr] lg:gap-12">
            <div className="flex flex-col justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ef745e]">The tool / 02</p>
                <h2 className="font-display mt-5 max-w-sm text-4xl font-semibold leading-[0.92] tracking-[-0.07em] sm:text-5xl">Drop the subject.<br /><span className="text-[#9fada7]">Keep the focus.</span></h2>
              </div>
              <p className="mt-10 max-w-xs font-mono text-[10px] leading-5 uppercase tracking-[0.1em] text-[#9fada7]">ONE IMAGE AT A TIME<br />UP TO 8 MB / ALL WORK HAPPENS SERVER-SIDE</p>
            </div>

            <div className="border border-[#8a9992] p-3 sm:p-4">
              <input ref={inputRef} id="image-file" className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleInput} />
              {(status === "idle" || status === "error") && (
                <div
                  className={`relative grid min-h-[350px] place-items-center overflow-hidden border px-6 text-center transition ${isDragging ? "border-[#ef745e] bg-[#2c3c37]" : "border-[#60716a] bg-[#202b28]"}`}
                  onDragEnter={event => { event.preventDefault(); setIsDragging(true); }}
                  onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={event => { event.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                >
                  <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden font-display text-[clamp(6rem,20vw,13rem)] font-bold leading-none tracking-[-0.12em] text-white/[0.035]">DROP</div>
                  <div className="relative max-w-sm">
                    <span className={`mx-auto grid size-12 place-items-center border ${status === "error" ? "border-[#ef745e] text-[#ef745e]" : "border-[#afc5bb] text-[#afc5bb]"}`}>{status === "error" ? <CircleAlert className="size-5" /> : <ImagePlus className="size-5" />}</span>
                    <h3 className="font-display mt-6 text-3xl font-semibold tracking-[-0.06em]">{status === "error" ? "That one didn’t clear." : "Place an image here."}</h3>
                    <p className={`mt-3 text-sm leading-6 ${status === "error" ? "text-[#ef8d7b]" : "text-[#aebbb5]"}`}>{status === "error" ? error : "Drag it in, or choose it from your device. JPG, PNG and WebP are ready to cut."}</p>
                    <button type="button" onClick={() => inputRef.current?.click()} className="mt-7 inline-flex items-center gap-3 border border-[#f4f1e8] px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition hover:border-[#ef745e] hover:bg-[#ef745e] hover:text-[#17201f]"><Upload className="size-3" /> Select image</button>
                  </div>
                </div>
              )}

              {status !== "idle" && status !== "error" && previewUrl && (
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_215px]">
                  <div className="relative min-h-[345px] overflow-hidden bg-[#d8ded7]">
                    <img src={previewUrl} alt="Selected source image" className="absolute inset-0 size-full object-contain p-5" />
                    <span className="absolute left-3 top-3 bg-[#f4f1e8] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#17201f]">Original / {selectedFile && formatBytes(selectedFile.size)}</span>
                    <button type="button" onClick={reset} className="absolute right-3 top-3 grid size-8 place-items-center bg-[#17201f] text-[#f4f1e8] transition hover:bg-[#e84d31]" aria-label="Choose another image"><RotateCcw className="size-4" /></button>
                  </div>
                  <div className="flex min-h-[260px] flex-col justify-between border border-[#60716a] bg-[#202b28] p-4">
                    <div>
                      <FileImage className="size-5 text-[#ef745e]" />
                      <p className="mt-6 break-all font-mono text-[10px] uppercase leading-5 tracking-[0.08em] text-[#f4f1e8]">{selectedFile?.name}</p>
                      {status === "processing" ? <div aria-live="polite" className="mt-6 border-l-2 border-[#ef745e] pl-3 text-sm leading-6 text-[#d2ded8]"><span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#ef745e]"><Loader2 className="size-3 animate-spin" /> Cutting around edges</span><p className="mt-2">Hold tight. We’re separating figure from ground.</p></div> : <p className="mt-6 text-sm leading-6 text-[#b2c0b9]">Ready when you are. The output will retain a transparent background.</p>}
                    </div>
                    <div className="mt-8">
                      <button type="button" disabled={status === "processing"} onClick={removeBackground} className="flex w-full items-center justify-between bg-[#ef745e] px-3 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#17201f] transition hover:bg-[#f4f1e8] disabled:opacity-60">{status === "processing" ? "In progress" : "Remove background"}<ArrowRight className="size-3" /></button>
                      <button type="button" disabled={status === "processing"} onClick={reset} className="mt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-[#a7b5af] hover:text-[#ef745e] disabled:opacity-50">Replace file</button>
                    </div>
                  </div>
                </div>
              )}

              {status === "success" && resultUrl && previewUrl && (
                <div id="output" className="mt-3 border border-[#60716a] p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#60716a] pb-3">
                    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.11em] text-[#d8f0dd]"><span className="grid size-5 place-items-center bg-[#d8f0dd] text-[#17201f]"><Check className="size-3" /></span> Cutout complete / export desk</p>
                    <div className="flex flex-wrap gap-2"><button type="button" onClick={resetAppliedEdits} className="border border-[#60716a] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#d2ded8] transition hover:border-[#ef745e] hover:text-[#ef745e]">Reset edits</button><a href={resultUrl} download={downloadName} className="inline-flex items-center gap-3 bg-[#f4f1e8] px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#17201f] transition hover:bg-[#ef745e]"><ArrowDownRight className="size-3" /> Download current</a></div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <figure className="border border-[#60716a] bg-[#d8ded7]"><figcaption className="border-b border-[#60716a] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.11em] text-[#17201f]">{previewUrl === baseResultUrl ? "Source cutout" : "Before"}</figcaption><div className="h-48 p-3"><img src={previewUrl} alt="Original upload or selected cutout" className="size-full object-contain" /></div></figure>
                    <figure className="border border-[#60716a]"><figcaption className="border-b border-[#60716a] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.11em] text-[#c7d4ce]">After / export preview</figcaption><div className={`h-48 overflow-hidden p-3 ${backgroundColor === "transparent" ? "checkerboard" : ""}`} style={{ backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor }}><img src={resultUrl} alt="Background removed result" className="size-full object-contain transition-transform duration-200" style={{ transform: `scale(${cropZoom}) translate(${cropX / 5}px, ${cropY / 5}px)`, filter: shadowEnabled ? `drop-shadow(0 ${shadowOffsetY / 2}px ${shadowBlur / 3}px rgba(17, 28, 27, ${shadowOpacity / 100}))` : undefined }} /></div></figure>
                  </div>
                  <div className="mt-3 grid gap-3 border-t border-[#60716a] pt-3 lg:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <div className="flex items-center justify-between"><p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-[#d2ded8]"><SlidersHorizontal className="size-3 text-[#ef745e]" /> Frame crop</p><button type="button" onClick={() => { setCropZoom(1); setCropX(0); setCropY(0); }} className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9fada7] hover:text-[#ef745e]">Reset crop</button></div>
                      <label className="mt-3 block font-mono text-[9px] uppercase tracking-[0.1em] text-[#aebbb5]">Zoom {cropZoom.toFixed(2)}×<input aria-label="Crop zoom" className="mt-2 block w-full accent-[#ef745e]" type="range" min="1" max="1.8" step="0.01" value={cropZoom} onChange={event => setCropZoom(Number(event.target.value))} /></label>
                      <div className="mt-3 grid grid-cols-2 gap-3"><label className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#aebbb5]">X {cropX}<input aria-label="Crop horizontal position" className="mt-2 block w-full accent-[#ef745e]" type="range" min="-100" max="100" value={cropX} onChange={event => setCropX(Number(event.target.value))} /></label><label className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#aebbb5]">Y {cropY}<input aria-label="Crop vertical position" className="mt-2 block w-full accent-[#ef745e]" type="range" min="-100" max="100" value={cropY} onChange={event => setCropY(Number(event.target.value))} /></label></div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.11em] text-[#d2ded8]">Drop shadow</p><button type="button" onClick={() => setShadowEnabled(value => !value)} className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${shadowEnabled ? "border-[#ef745e] bg-[#ef745e] text-[#17201f]" : "border-[#60716a] text-[#aebbb5]"}`}>{shadowEnabled ? "On" : "Off"}</button></div>
                      <div className={`mt-3 grid grid-cols-3 gap-2 transition-opacity ${shadowEnabled ? "opacity-100" : "pointer-events-none opacity-35"}`}><label className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#aebbb5]">Opacity {shadowOpacity}<input aria-label="Shadow opacity" className="mt-2 block w-full accent-[#ef745e]" type="range" min="0" max="100" value={shadowOpacity} onChange={event => setShadowOpacity(Number(event.target.value))} /></label><label className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#aebbb5]">Blur {shadowBlur}<input aria-label="Shadow blur" className="mt-2 block w-full accent-[#ef745e]" type="range" min="0" max="48" value={shadowBlur} onChange={event => setShadowBlur(Number(event.target.value))} /></label><label className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#aebbb5]">Y {shadowOffsetY}<input aria-label="Shadow vertical offset" className="mt-2 block w-full accent-[#ef745e]" type="range" min="-40" max="64" value={shadowOffsetY} onChange={event => setShadowOffsetY(Number(event.target.value))} /></label></div>
                      <div className="mt-4 border-t border-[#60716a] pt-3"><p className="font-mono text-[9px] uppercase tracking-[0.11em] text-[#d2ded8]">Solid background</p><div className="mt-2 flex flex-wrap gap-1.5">{BACKGROUND_PRESETS.map(preset => <button key={preset.value} type="button" onClick={() => { setBackgroundColor(preset.value); setHexError(""); }} title={preset.label} aria-label={`${preset.label} background`} className={`grid size-7 place-items-center border transition ${backgroundColor === preset.value ? "border-[#ef745e] ring-1 ring-[#ef745e]" : "border-[#60716a] hover:border-[#d2ded8]"}`}>{preset.value === "transparent" ? <span className="checkerboard size-4 border border-[#aebbb5]" /> : <span className="size-4 border border-black/15" style={{ backgroundColor: preset.swatch }} />}</button>)}</div><div className="mt-3 flex gap-1"><label className="sr-only" htmlFor="custom-background-color">Custom hex color</label><input id="custom-background-color" value={customHex} onChange={event => setCustomHex(event.target.value)} onKeyDown={event => { if (event.key === "Enter") applyCustomHex(); }} placeholder="#rrggbb" className="min-w-0 flex-1 border border-[#60716a] bg-[#17201f] px-2 py-1.5 font-mono text-[10px] uppercase text-[#f4f1e8] outline-none focus:border-[#ef745e]" /><button type="button" onClick={applyCustomHex} className="border border-[#ef745e] px-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[#ef745e] hover:bg-[#ef745e] hover:text-[#17201f]">Set</button></div>{hexError && <p className="mt-2 text-xs text-[#ef9a8a]">{hexError}</p>}<p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[#9fada7]">{BACKGROUND_PRESETS.find(preset => preset.value === backgroundColor)?.label || "Custom hex"} export</p></div>
                      <div className="mt-4 border-t border-[#60716a] pt-3"><p className="font-mono text-[9px] uppercase tracking-[0.11em] text-[#d2ded8]">Export size</p><div className="mt-2 grid grid-cols-2 gap-1">{EXPORT_SIZE_PRESETS.map(preset => <button key={preset.value} type="button" onClick={() => setExportSize(preset.value)} className={`border px-2 py-1.5 text-left transition ${exportSize === preset.value ? "border-[#ef745e] bg-[#ef745e] text-[#17201f]" : "border-[#60716a] text-[#aebbb5] hover:border-[#d2ded8]"}`}><span className="block font-mono text-[9px] uppercase tracking-[0.07em]">{preset.label}</span><span className="mt-0.5 block font-mono text-[8px] opacity-75">{preset.detail}</span></button>)}</div></div>
                      <div className="mt-4 border-t border-[#60716a] pt-3"><p className="font-mono text-[9px] uppercase tracking-[0.11em] text-[#d2ded8]">Export size</p><div className="mt-2 grid grid-cols-2 gap-1">{EXPORT_SIZE_PRESETS.map(preset => <button key={preset.value} type="button" onClick={() => setExportSize(preset.value)} className={`border px-2 py-1.5 text-left transition ${exportSize === preset.value ? "border-[#ef745e] bg-[#ef745e] text-[#17201f]" : "border-[#60716a] text-[#aebbb5] hover:border-[#d2ded8]"}`}><span className="block font-mono text-[9px] uppercase tracking-[0.07em]">{preset.label}</span><span className="mt-0.5 block font-mono text-[8px] opacity-75">{preset.detail}</span></button>)}</div></div>
                      <div className="mt-4 border-t border-[#60716a] pt-3"><p className="font-mono text-[9px] uppercase tracking-[0.11em] text-[#d2ded8]">File format</p><div className="mt-2 grid grid-cols-3 gap-1">{EXPORT_FORMATS.map(format => <button key={format.value} type="button" onClick={() => setExportFormat(format.value)} className={`border px-2 py-1.5 text-left transition ${exportFormat === format.value ? "border-[#ef745e] bg-[#ef745e] text-[#17201f]" : "border-[#60716a] text-[#aebbb5] hover:border-[#d2ded8]"}`}><span className="block font-mono text-[9px] uppercase tracking-[0.07em]">{format.label}</span><span className="mt-0.5 block font-mono text-[8px] opacity-75">{format.detail}</span></button>)}</div>{exportFormat === "png" ? <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-[#9fada7]">PNG is lossless. Quality is not applied.</p> : <label className="mt-3 block font-mono text-[9px] uppercase tracking-[0.08em] text-[#aebbb5]">Quality {exportQuality}<input aria-label="Export quality" className="mt-2 block w-full accent-[#ef745e]" type="range" min="40" max="100" value={exportQuality} onChange={event => setExportQuality(Number(event.target.value))} /></label>}</div>
                    </div>
                    <button type="button" onClick={applyRefinements} disabled={isRefining} className="self-end bg-[#ef745e] px-3 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#17201f] transition hover:bg-[#f4f1e8] disabled:opacity-60">{isRefining ? <span className="flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> Applying</span> : "Apply & save"}</button>
                  </div>
                  {error && <p className="mt-3 border-l-2 border-[#ef745e] pl-3 text-sm text-[#ef9a8a]" role="alert">{error}</p>}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-b border-[#17201f] bg-[#d9e9df]">
          <div className="container border-x border-[#17201f] py-8 sm:py-10">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#17201f] pb-4">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b33f29]">Processing history / local desk</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Recent cutouts.</h2></div>
              <div className="max-w-xs"><p className="font-mono text-[9px] uppercase leading-5 tracking-[0.1em] text-[#52605b]">Kept only in this browser so you can reopen a download without reprocessing.</p>{history.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={toggleAllBatchItems} className="border-b border-[#17201f] pb-0.5 font-mono text-[9px] uppercase tracking-[0.1em] hover:border-[#e84d31] hover:text-[#e84d31]">{batchQueueIds.size === history.length ? "Clear queue" : "Select all"}</button><button type="button" onClick={downloadBatch} disabled={!batchQueueIds.size || isBatchExporting} className="bg-[#17201f] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#f4f1e8] transition hover:bg-[#e84d31] disabled:opacity-40">{isBatchExporting ? "Preparing ZIP" : `Download queue (${batchQueueIds.size})`}</button></div>}{batchMessage && <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[#52605b]" role="status">{batchMessage}</p>}</div>
            </div>
            {history.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{history.map((item, index) => <article key={item.id} className={`relative flex min-h-28 items-center gap-3 border bg-[#f4f1e8] p-3 ${batchQueueIds.has(item.id) ? "border-[#e84d31] ring-1 ring-[#e84d31]" : "border-[#17201f]"}`}><label className="absolute right-2 top-2 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[#63706b]"><input aria-label={`Add ${item.label} to batch export`} type="checkbox" checked={batchQueueIds.has(item.id)} onChange={() => toggleBatchItem(item.id)} className="accent-[#e84d31]" /> Queue</label><div className="checkerboard grid size-16 shrink-0 place-items-center overflow-hidden border border-[#17201f]"><img src={item.url} alt="Processed transparent thumbnail" className="size-full object-contain p-1" /></div><div className="min-w-0 flex-1 pr-8"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#b33f29]">Cutout {String(index + 1).padStart(2, "0")}</p>{renamingHistoryId === item.id ? <div className="mt-2 flex gap-1"><input aria-label="History entry name" className="min-w-0 flex-1 border border-[#17201f] bg-white px-2 py-1 text-sm outline-none focus:border-[#e84d31]" value={historyLabelDraft} onChange={event => setHistoryLabelDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") saveRename(item.id); if (event.key === "Escape") setRenamingHistoryId(null); }} autoFocus /><button type="button" onClick={() => saveRename(item.id)} className="bg-[#17201f] px-2 font-mono text-[9px] uppercase text-[#f4f1e8] hover:bg-[#e84d31]">Save</button></div> : <div className="mt-2 flex items-center gap-2"><p className="min-w-0 truncate text-sm font-semibold">{item.label}</p><button type="button" onClick={() => startRename(item)} className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#63706b] hover:text-[#e84d31]">Rename</button></div>}<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#63706b]">{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p><div className="mt-3 flex flex-wrap gap-x-3 gap-y-2"><a href={item.url} download={item.downloadName} className="inline-flex items-center gap-2 border-b border-[#17201f] pb-0.5 font-mono text-[9px] uppercase tracking-[0.1em] hover:border-[#e84d31] hover:text-[#e84d31]">Download <ArrowDownRight className="size-3" /></a><button type="button" onClick={() => duplicateWithNewBackground(item)} className="border-b border-[#17201f] pb-0.5 font-mono text-[9px] uppercase tracking-[0.1em] hover:border-[#e84d31] hover:text-[#e84d31]">Duplicate + color</button></div></div></article>)}</div> : <div className="mt-4 border border-dashed border-[#63706b] px-4 py-7 font-mono text-[10px] uppercase tracking-[0.1em] text-[#52605b]">No cutouts yet. Your completed PNGs will appear here on this device.</div>}
          </div>
        </section>

        <section id="how-it-works" className="container border-x border-[#17201f] py-14 sm:py-20">
          <div className="mb-8 grid gap-6 border-b border-[#17201f] pb-6 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <h2 className="font-display max-w-2xl text-4xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-6xl">Not magic.<br />Just a cleaner separation.</h2>
            <p className="max-w-sm text-base leading-7 text-[#43504c]">Designed for people who have a use for the image on the other side: presentations, product shots, collages, mockups, whatever is next.</p>
          </div>
          <div className="grid border-l border-[#17201f] sm:grid-cols-3">
            {[
              ["01", "Send", "Drop the original. We accept JPG, PNG and WebP files up to 8 MB."],
              ["02", "Separate", "The server isolates the subject and prepares alpha transparency."],
              ["03", "Carry on", "Download the cutout as a clean PNG and use it wherever it needs to go."],
            ].map(([step, title, copy]) => (
              <article key={step} className="min-h-52 border-b border-r border-[#17201f] px-5 py-5 sm:border-b-0 sm:px-6 sm:py-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#e84d31]">{step}</p>
                <h3 className="mt-10 text-2xl font-semibold tracking-[-0.055em]">{title}</h3>
                <p className="mt-3 max-w-60 text-sm leading-6 text-[#52605b]">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
