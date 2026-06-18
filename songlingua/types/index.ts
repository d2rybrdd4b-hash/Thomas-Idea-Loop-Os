export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
}

export interface VocabItem {
  en: string;
  de: string;
  note: string;
}

export interface SlangItem {
  phrase: string;
  de: string;
}

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LyricsAnalysis {
  direct: string;
  natural: string;
  meaning: string;
  vocab: VocabItem[];
  slang: SlangItem[];
  tip: string;
  level: CEFRLevel;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  trackTitle?: string;
  trackArtist?: string;
  lyricsSnippet: string;
  analysis: LyricsAnalysis;
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
