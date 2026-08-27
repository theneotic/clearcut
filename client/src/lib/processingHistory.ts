export type ProcessingHistoryItem = {
  id: string;
  url: string;
  downloadName: string;
  label: string;
  createdAt: number;
};

const HISTORY_KEY = "clearcut-processing-history-v1";
const MAX_HISTORY_ITEMS = 6;

export function appendHistoryItem(
  current: ProcessingHistoryItem[],
  item: ProcessingHistoryItem,
): ProcessingHistoryItem[] {
  return [item, ...current.filter(existing => existing.url !== item.url)].slice(0, MAX_HISTORY_ITEMS);
}

export function readProcessingHistory(): ProcessingHistoryItem[] {
  try {
    const stored = window.localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryItem).slice(0, MAX_HISTORY_ITEMS).map(item => ({
      ...item,
      label: typeof item.label === "string" && item.label.trim() ? item.label : item.downloadName.replace(/\.png$/i, ""),
    }));
  } catch {
    return [];
  }
}

export function writeProcessingHistory(items: ProcessingHistoryItem[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // Storage can be unavailable in private browsing contexts; the in-memory panel still works.
  }
}

export function renameHistoryItem(
  current: ProcessingHistoryItem[],
  id: string,
  label: string,
): ProcessingHistoryItem[] {
  const cleanLabel = label.trim().slice(0, 48);
  if (!cleanLabel) return current;
  return current.map(item => item.id === id ? { ...item, label: cleanLabel } : item);
}

function isHistoryItem(value: unknown): value is ProcessingHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ProcessingHistoryItem>;
  return typeof item.id === "string" && typeof item.url === "string" && typeof item.downloadName === "string" && typeof item.createdAt === "number";
}
