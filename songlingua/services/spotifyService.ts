import { createOAuthState, createPkcePair } from "@/lib/pkce";
import type { SpotifyTokens, Track } from "@/types";

const TOKENS_KEY = "songlingua_spotify_tokens";
const VERIFIER_KEY = "songlingua_pkce_verifier";
const STATE_KEY = "songlingua_oauth_state";
const SCOPES = "user-read-currently-playing user-read-playback-state";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ?? "";

function readTokens(): SpotifyTokens | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}

function writeTokens(tokens: SpotifyTokens) {
  window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

function isConfigured(): boolean {
  return Boolean(CLIENT_ID && REDIRECT_URI);
}

function isConnected(): boolean {
  return readTokens() !== null;
}

async function connect(): Promise<void> {
  if (!isConfigured()) {
    throw new Error(
      "Spotify ist noch nicht konfiguriert (NEXT_PUBLIC_SPOTIFY_CLIENT_ID / NEXT_PUBLIC_SPOTIFY_REDIRECT_URI fehlen)."
    );
  }
  const { codeVerifier, codeChallenge } = await createPkcePair();
  const state = createOAuthState();
  window.sessionStorage.setItem(VERIFIER_KEY, codeVerifier);
  window.sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: SCOPES,
    state,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function handleCallback(code: string, state: string): Promise<void> {
  const storedState = window.sessionStorage.getItem(STATE_KEY);
  const codeVerifier = window.sessionStorage.getItem(VERIFIER_KEY);
  window.sessionStorage.removeItem(STATE_KEY);
  window.sessionStorage.removeItem(VERIFIER_KEY);

  if (!storedState || storedState !== state) {
    throw new Error("Sicherheitsprüfung fehlgeschlagen (state stimmt nicht überein). Bitte erneut verbinden.");
  }
  if (!codeVerifier) {
    throw new Error("PKCE-Verifier nicht gefunden. Bitte erneut verbinden.");
  }

  const res = await fetch("/api/spotify/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, codeVerifier, redirectUri: REDIRECT_URI }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Spotify-Login fehlgeschlagen.");
  }

  writeTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
}

async function ensureValidAccessToken(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;

  const oneMinute = 60 * 1000;
  if (Date.now() < tokens.expiresAt - oneMinute) {
    return tokens.accessToken;
  }

  const res = await fetch("/api/spotify/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });
  if (!res.ok) {
    disconnect();
    return null;
  }
  const data = await res.json();
  const updated: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  writeTokens(updated);
  return updated.accessToken;
}

async function getCurrentTrack(): Promise<{ isPlaying: boolean; track: Track | null }> {
  const accessToken = await ensureValidAccessToken();
  if (!accessToken) {
    return { isPlaying: false, track: null };
  }
  const res = await fetch("/api/spotify/current-track", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return { isPlaying: false, track: null };
  }
  return res.json();
}

function disconnect(): void {
  window.localStorage.removeItem(TOKENS_KEY);
}

export const spotifyService = {
  isConfigured,
  isConnected,
  connect,
  handleCallback,
  getCurrentTrack,
  disconnect,
};
