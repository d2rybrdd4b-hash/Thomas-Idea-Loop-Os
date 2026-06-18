export function LyricsInput({
  value,
  onChange,
  onAnalyze,
  loading,
  trackTitle,
  trackArtist,
}: {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  trackTitle?: string;
  trackArtist?: string;
}) {
  const searchUrl =
    trackTitle &&
    `https://genius.com/search?q=${encodeURIComponent(
      [trackTitle, trackArtist].filter(Boolean).join(" ")
    )}`;

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-zinc-300">
          Textausschnitt einfügen (kurz, kein ganzer Song)
        </label>
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 rounded-full border border-surface-border px-3 py-1 text-xs font-medium text-zinc-300 active:scale-[0.98]"
          >
            Songtext suchen ↗
          </a>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="z.B. eine Strophe oder ein paar Zeilen…"
        className="w-full resize-none rounded-xl border border-surface-border bg-surface p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
      />
      <button
        onClick={onAnalyze}
        disabled={loading || !value.trim()}
        className="mt-3 w-full rounded-full bg-brand py-3 font-semibold text-black disabled:opacity-40"
      >
        {loading ? "Analysiere…" : "Analysieren"}
      </button>
    </div>
  );
}
