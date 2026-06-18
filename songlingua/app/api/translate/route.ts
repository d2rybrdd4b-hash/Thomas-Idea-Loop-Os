import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  "Du bist ein präziser Übersetzer und Englisch-Sprachlern-Coach. Analysiere ausschließlich den bereitgestellten Textausschnitt. Gib niemals vollständige Songtexte aus. Antworte nur mit validem JSON.";

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Kein Text übergeben." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY ist auf dem Server nicht gesetzt." },
      { status: 500 }
    );
  }

  const userPrompt = `Textausschnitt:
"""
${text.trim()}
"""

Gib ausschließlich dieses JSON-Format zurück, ohne weiteren Text davor oder danach:
{
  "direct": "Wort-für-Wort Übersetzung",
  "natural": "Natürliche deutsche Übersetzung",
  "meaning": "Bedeutung im Kontext",
  "vocab": [{"en": "Wort", "de": "Übersetzung", "note": "Hinweis"}],
  "slang": [{"phrase": "Ausdruck", "de": "Bedeutung"}],
  "tip": "Lerntipp",
  "level": "A1|A2|B1|B2|C1|C2"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? "Claude-API-Anfrage fehlgeschlagen." },
      { status: res.status }
    );
  }

  const raw: string = data?.content?.[0]?.text ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "Antwort der KI war kein gültiges JSON." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Antwort der KI konnte nicht gelesen werden." }, { status: 502 });
  }
}
