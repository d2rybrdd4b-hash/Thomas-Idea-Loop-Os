export function SpotifyConnectButton({
  connected,
  configured,
  onConnect,
  onDisconnect,
}: {
  connected: boolean;
  configured: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  if (!configured) {
    return (
      <div className="rounded-2xl border border-surface-border bg-surface-card p-4 text-sm text-zinc-400">
        Spotify ist noch nicht eingerichtet. Trage{" "}
        <code className="text-zinc-300">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> und{" "}
        <code className="text-zinc-300">NEXT_PUBLIC_SPOTIFY_REDIRECT_URI</code> als
        Umgebungsvariablen ein.
      </div>
    );
  }

  if (connected) {
    return (
      <button
        onClick={onDisconnect}
        className="w-full rounded-full border border-surface-border bg-surface-card py-3 font-semibold text-zinc-300 active:scale-[0.98]"
      >
        Spotify trennen
      </button>
    );
  }

  return (
    <button
      onClick={onConnect}
      className="w-full rounded-full bg-brand py-4 text-lg font-semibold text-black active:scale-[0.98]"
    >
      Mit Spotify verbinden
    </button>
  );
}
