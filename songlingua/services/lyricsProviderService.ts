// Austauschbare Schnittstelle für Songtext-Beschaffung.
//
// Version 1 (ManualLyricsProvider) liefert absichtlich IMMER null:
// SongLingua lädt keine Lyrics automatisch aus dem Internet, da Songtexte
// urheberrechtlich geschützt sind. Der Nutzer fügt einen kurzen Ausschnitt
// selbst ein.
//
// Ein späterer, lizenzierter Anbieter (z.B. Musixmatch, LyricFind) kann
// dieses Interface implementieren und hier ausgetauscht werden, ohne den
// Rest der App anzufassen.

export interface LyricsProvider {
  name: string;
  fetchLyrics(
    trackId: string,
    trackTitle: string,
    trackArtist: string
  ): Promise<string | null>;
}

class ManualLyricsProvider implements LyricsProvider {
  name = "manual";

  async fetchLyrics(): Promise<string | null> {
    return null;
  }
}

export const lyricsProvider: LyricsProvider = new ManualLyricsProvider();
