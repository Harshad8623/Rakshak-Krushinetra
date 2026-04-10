const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export interface FarmContext {
  threatsToday: number;
  topZoneRisk: string;
  cropHealthAvg: number;
  weather: string;
  securityScore: number;
  droneStatus: string;
}

export async function getGeminiInsight(ctx: FarmContext): Promise<string> {
  const prompt = `You are an AI agricultural security advisor for an Indian farm protection system called Rakshak KrishiNet.

Farm status:
- Threats detected today: ${ctx.threatsToday}
- Highest risk zone: Zone ${ctx.topZoneRisk}
- Average crop health: ${ctx.cropHealthAvg}%
- Weather: ${ctx.weather}
- Security score: ${ctx.securityScore}/100
- Drone status: ${ctx.droneStatus}

Give ONE concise, personalized, actionable recommendation (max 2 sentences) for the farmer to improve farm security or crop health right now. Be specific, practical and encouraging. Do not use bullet points.`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 100, temperature: 0.7 },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? 'Farm system operating normally. Continue monitoring Zone B closely.';
  } catch {
    return 'Increase patrol frequency in Zone B tonight — storm conditions increase animal activity near crop borders.';
  }
}
