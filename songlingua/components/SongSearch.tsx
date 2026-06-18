"use client";

import { useEffect, useState } from "react";
import type { Track } from "@/types";

// Füllt sich automatisch mit dem aktuell auf Spotify laufenden Song,
// bleibt aber frei editierbar - so funktioniert die Suche auch ohne
// Spotify-Verbindung oder für einen anderen Song als den gerade laufenden.
export function SongSearch({ track }: { track: Track | null }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setArtist(track.artist);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  const searchUrl = title.trim()
    ? `https://genius.com/search?q=${encodeURIComponent(
        [title, artist].filter((part) => part.trim()).join(" ")
      )}`
    : null;

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
      <p className="mb-2 text-sm font-medium text-zinc-300">Songtext suchen</p>
      <div className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Songtitel"
          className="w-full rounded-xl border border-surface-border bg-surface p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
        />
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Interpret (optional)"
          className="w-full rounded-xl border border-surface-border bg-surface p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
        />
        {searchUrl ? (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full border border-surface-border py-3 text-center text-sm font-semibold text-zinc-200 active:scale-[0.98]"
          >
            Auf Genius suchen ↗
          </a>
        ) : (
          <button
            disabled
            className="w-full rounded-full border border-surface-border py-3 text-sm font-semibold text-zinc-600 opacity-40"
          >
            Auf Genius suchen ↗
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-600">
        Öffnet eine Suche auf Genius.com in neuem Tab. Lyrics dort selbst kopieren und unten
        einfügen - SongLingua lädt keine Songtexte automatisch (Urheberrecht).
      </p>
    </div>
  );
}
