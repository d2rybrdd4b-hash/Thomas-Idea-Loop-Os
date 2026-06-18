"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { spotifyService } from "@/services/spotifyService";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const spotifyError = searchParams.get("error");

    if (spotifyError) {
      setError(`Spotify hat die Verbindung abgelehnt: ${spotifyError}`);
      return;
    }
    if (!code || !state) {
      setError("Es fehlen Parameter in der Antwort von Spotify.");
      return;
    }

    spotifyService
      .handleCallback(code, state)
      .then(() => router.replace("/"))
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {error ? (
        <>
          <p className="text-red-400">{error}</p>
          <a href="/" className="rounded-full bg-brand px-6 py-3 font-semibold text-black">
            Zurück zur App
          </a>
        </>
      ) : (
        <p className="text-zinc-400">Verbinde mit Spotify…</p>
      )}
    </>
  );
}

export default function CallbackPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Suspense fallback={<p className="text-zinc-400">Verbinde mit Spotify…</p>}>
        <CallbackInner />
      </Suspense>
    </main>
  );
}
