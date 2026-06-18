import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ error: "Kein Spotify-Token übergeben." }, { status: 401 });
  }

  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { authorization: auth },
    cache: "no-store",
  });

  if (res.status === 204) {
    return NextResponse.json({ isPlaying: false, track: null });
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: "Spotify-Anfrage fehlgeschlagen." },
      { status: res.status }
    );
  }

  const data = await res.json();
  if (!data || !data.item) {
    return NextResponse.json({ isPlaying: false, track: null });
  }

  const track = {
    id: data.item.id as string,
    title: data.item.name as string,
    artist: (data.item.artists ?? []).map((a: { name: string }) => a.name).join(", "),
    album: data.item.album?.name ?? "",
    albumArt: data.item.album?.images?.[0]?.url ?? null,
    progressMs: data.progress_ms ?? 0,
    durationMs: data.item.duration_ms ?? 0,
    isPlaying: Boolean(data.is_playing),
  };

  return NextResponse.json({ isPlaying: Boolean(data.is_playing), track });
}
