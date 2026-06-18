import type { LyricsAnalysis } from "@/types";

async function analyzeLyrics(text: string): Promise<LyricsAnalysis> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Analyse fehlgeschlagen.");
  }
  return data as LyricsAnalysis;
}

export const translationService = {
  analyzeLyrics,
};
