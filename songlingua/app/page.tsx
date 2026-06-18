"use client";

import { useEffect, useState } from "react";
import { spotifyService } from "@/services/spotifyService";
import { translationService } from "@/services/translationService";
import { storageService } from "@/services/storageService";
import { SpotifyConnectButton } from "@/components/SpotifyConnectButton";
import { NowPlaying } from "@/components/NowPlaying";
import { LyricsInput } from "@/components/LyricsInput";
import { SongSearch } from "@/components/SongSearch";
import { TranslationView } from "@/components/TranslationView";
import { HistoryList } from "@/components/HistoryList";
import type { HistoryEntry, LyricsAnalysis, Track } from "@/types";

const POLL_INTERVAL_MS = 10000;

export default function HomePage() {
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);

  const [lyrics, setLyrics] = useState("");
  const [analysis, setAnalysis] = useState<LyricsAnalysis | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setConfigured(spotifyService.isConfigured());
    setConnected(spotifyService.isConnected());
    setHistory(storageService.getHistory());
  }, []);

  useEffect(() => {
    if (!connected) {
      setTrack(null);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const result = await spotifyService.getCurrentTrack();
      if (!cancelled) setTrack(result.track);
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [connected]);

  const handleConnect = async () => {
    try {
      await spotifyService.connect();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verbindung fehlgeschlagen.");
    }
  };

  const handleDisconnect = () => {
    spotifyService.disconnect();
    setConnected(false);
    setTrack(null);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await translationService.analyzeLyrics(lyrics);
      setAnalysis(result);
      setAnalyzedText(lyrics);
      const entry = storageService.addHistoryEntry({
        lyricsSnippet: lyrics,
        analysis: result,
        trackTitle: track?.title,
        trackArtist: track?.artist,
      });
      setHistory((prev) => [entry, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    setAnalysis(entry.analysis);
    setAnalyzedText(entry.lyricsSnippet);
    setLyrics(entry.lyricsSnippet);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteHistory = (id: string) => {
    storageService.deleteHistoryEntry(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4 pb-16">
      <header className="pt-4 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">SongLingua</h1>
        <p className="text-sm text-zinc-500">Englisch lernen mit deinen Songs</p>
      </header>

      <SpotifyConnectButton
        connected={connected}
        configured={configured}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <NowPlaying connected={connected} track={track} />

      <SongSearch track={track} />

      <LyricsInput
        value={lyrics}
        onChange={setLyrics}
        onAnalyze={handleAnalyze}
        loading={loading}
      />

      {error && (
        <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {analysis && <TranslationView original={analyzedText} analysis={analysis} />}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Verlauf
        </h2>
        <HistoryList
          history={history}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
        />
      </section>
    </main>
  );
}
