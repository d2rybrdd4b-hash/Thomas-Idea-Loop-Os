import type { HistoryEntry, LyricsAnalysis } from "@/types";

const HISTORY_KEY = "songlingua_history";

function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function addHistoryEntry(input: {
  lyricsSnippet: string;
  analysis: LyricsAnalysis;
  trackTitle?: string;
  trackArtist?: string;
}): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const current = getHistory();
  saveHistory([entry, ...current]);
  return entry;
}

function deleteHistoryEntry(id: string): void {
  saveHistory(getHistory().filter((e) => e.id !== id));
}

function clearHistory(): void {
  saveHistory([]);
}

export const storageService = {
  getHistory,
  addHistoryEntry,
  deleteHistoryEntry,
  clearHistory,
};
