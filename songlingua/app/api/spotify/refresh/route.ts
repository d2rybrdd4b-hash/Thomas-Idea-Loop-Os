import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { refreshToken } = await req.json();

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Spotify Client ID ist auf dem Server nicht gesetzt." },
      { status: 500 }
    );
  }
  if (!refreshToken) {
    return NextResponse.json({ error: "refreshToken fehlt." }, { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error_description ?? "Spotify-Token-Erneuerung fehlgeschlagen." },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
