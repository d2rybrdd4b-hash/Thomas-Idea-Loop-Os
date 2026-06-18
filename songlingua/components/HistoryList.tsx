import type { HistoryEntry } from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryList({
  history,
  onSelect,
  onDelete,
}: {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}) {
  if (history.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-600">
        Noch keine gespeicherten Analysen.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between gap-2 rounded-xl border border-surface-border bg-surface-card p-3"
        >
          <button onClick={() => onSelect(entry)} className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-zinc-100">
              {entry.trackTitle ?? "Ohne Titel"}
              {entry.trackArtist ? ` — ${entry.trackArtist}` : ""}
            </p>
            <p className="truncate text-xs text-zinc-500">{entry.lyricsSnippet}</p>
            <p className="text-xs text-zinc-600">{formatDate(entry.createdAt)}</p>
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="flex-shrink-0 rounded-full px-2 py-1 text-xs text-zinc-500 hover:text-red-400"
            aria-label="Löschen"
          >
            Löschen
          </button>
        </li>
      ))}
    </ul>
  );
}
