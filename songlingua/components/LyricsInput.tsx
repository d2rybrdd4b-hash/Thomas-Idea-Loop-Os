export function LyricsInput({
  value,
  onChange,
  onAnalyze,
  loading,
}: {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        Textausschnitt einfügen (kurz, kein ganzer Song)
      </label>
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
