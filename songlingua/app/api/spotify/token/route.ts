import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { code, codeVerifier, redirectUri } = await req.json();

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Spotify Client ID ist auf dem Server nicht gesetzt." },
      { status: 500 }
    );
  }
  if (!code || !codeVerifier || !redirectUri) {
    return NextResponse.json(
      { error: "code, codeVerifier oder redirectUri fehlen." },
      { status: 400 }
    );
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error_description ?? "Spotify-Token-Austausch fehlgeschlagen." },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
