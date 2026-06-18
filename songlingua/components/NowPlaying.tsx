import type { Track } from "@/types";
import { ProgressBar } from "./ProgressBar";

export function NowPlaying({
  connected,
  track,
}: {
  connected: boolean;
  track: Track | null;
}) {
  if (!connected) {
    return (
      <div className="rounded-2xl border border-surface-border bg-surface-card p-4 text-center text-sm text-zinc-500">
        Nicht mit Spotify verbunden.
      </div>
    );
  }

  if (!track) {
    return (
      <div className="rounded-2xl border border-surface-border bg-surface-card p-4 text-center text-sm text-zinc-500">
        Gerade läuft kein Song auf Spotify.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-surface-border bg-surface-card p-4">
      {track.albumArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.albumArt}
          alt={track.album}
          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-surface-border" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-zinc-100">{track.title}</p>
        <p className="truncate text-sm text-zinc-400">{track.artist}</p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              track.isPlaying ? "bg-brand" : "bg-zinc-600"
            }`}
          />
          <span className="text-xs text-zinc-500">
            {track.isPlaying ? "Spielt gerade" : "Pausiert"}
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar progressMs={track.progressMs} durationMs={track.durationMs} />
        </div>
      </div>
    </div>
  );
}
