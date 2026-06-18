import type { LyricsAnalysis } from "@/types";

export function TranslationView({
  original,
  analysis,
}: {
  original: string;
  analysis: LyricsAnalysis;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Original (Englisch)
        </p>
        <p className="whitespace-pre-wrap text-zinc-100">{original}</p>
      </div>

      <div className="rounded-2xl border border-brand/40 bg-surface-card p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
          Deutsche Übersetzung
        </p>
        <p className="whitespace-pre-wrap text-zinc-100">{analysis.natural}</p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Wort-für-Wort
        </p>
        <p className="text-sm text-zinc-300">{analysis.direct}</p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Bedeutung im Kontext
        </p>
        <p className="text-sm text-zinc-300">{analysis.meaning}</p>
      </div>

      {analysis.vocab.length > 0 && (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Vokabeln
          </p>
          <ul className="space-y-2">
            {analysis.vocab.map((v, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-zinc-100">{v.en}</span>
                <span className="text-zinc-500"> — </span>
                <span className="text-zinc-200">{v.de}</span>
                {v.note && <p className="text-xs text-zinc-500">{v.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.slang.length > 0 && (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Slang / Redewendungen
          </p>
          <ul className="space-y-2">
            {analysis.slang.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-zinc-100">{s.phrase}</span>
                <span className="text-zinc-500"> — </span>
                <span className="text-zinc-200">{s.de}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface-card p-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Lerntipp
          </p>
          <p className="text-sm text-zinc-300">{analysis.tip}</p>
        </div>
        <span className="ml-3 flex-shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-bold text-black">
          {analysis.level}
        </span>
      </div>
    </div>
  );
}
