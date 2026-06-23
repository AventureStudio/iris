/**
 * ElevenLabs text-to-speech proxy (Vercel serverless function).
 *
 * The API key is read from the ELEVENLABS_API_KEY environment variable and is
 * NEVER sent to the browser. If no key is configured the function returns 503
 * and the client falls back to the browser voice. Emotional tone maps to
 * ElevenLabs voice_settings; the spoken text is passed through unchanged.
 */

type Tone = "calm" | "normal" | "happy" | "playful";

const VOICE_SETTINGS: Record<Tone, { stability: number; style: number }> = {
  calm: { stability: 0.75, style: 0.1 },
  normal: { stability: 0.5, style: 0.35 },
  happy: { stability: 0.35, style: 0.6 },
  playful: { stability: 0.25, style: 0.8 },
};

// Default to a multilingual-capable public voice; override with ELEVENLABS_VOICE_ID.
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "ElevenLabs not configured" });
    return;
  }

  let body: { text?: string; tone?: string };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    res.status(400).json({ error: "invalid json" });
    return;
  }
  const text: string = (body.text || "").toString().slice(0, 800);
  const reqTone = body.tone ?? "normal";
  const tone: Tone = (["calm", "normal", "happy", "playful"].includes(reqTone) ? reqTone : "normal") as Tone;
  if (!text.trim()) {
    res.status(400).json({ error: "missing text" });
    return;
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const settings = VOICE_SETTINGS[tone];

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: settings.stability,
          style: settings.style,
          similarity_boost: 0.8,
          use_speaker_boost: true,
        },
      }),
    });

    if (!r.ok) {
      res.status(502).json({ error: "elevenlabs error", status: r.status });
      return;
    }

    const audio = Buffer.from(await r.arrayBuffer());
    res.setHeader("content-type", "audio/mpeg");
    res.setHeader("cache-control", "no-store");
    res.status(200).send(audio);
  } catch {
    res.status(502).json({ error: "upstream failure" });
  }
}
