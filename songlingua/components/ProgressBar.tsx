function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ProgressBar({
  progressMs,
  durationMs,
}: {
  progressMs: number;
  durationMs: number;
}) {
  const percent = durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;

  return (
    <div className="w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-zinc-500">
        <span>{formatMs(progressMs)}</span>
        <span>{formatMs(durationMs)}</span>
      </div>
    </div>
  );
}
