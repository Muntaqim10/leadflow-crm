import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const { stats } = body;

    const systemPrompt = `You are an expert hospitality sales analyst. 
You will be provided with a JSON summary of a hotel's CRM pipeline data (leads, revenue, top performers).
Your job is to generate a concise, professional 3-bullet-point executive summary highlighting:
1. Overall pipeline health (e.g. revenue, conversion rate).
2. The top performing manager or source.
3. An area of opportunity or concern (e.g. a lagging source or low conversion rate).

Guidelines:
- Output exactly 3 bullet points, using standard markdown asterisks (*).
- Keep each point to 1-2 sentences.
- Use a professional, analytical tone suitable for a Director of Sales.
- Do NOT include any introductory or concluding text. Just the 3 bullet points.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the current pipeline data snapshot:\n\n${JSON.stringify(stats, null, 2)}` }
        ],
        temperature: 0.2, // Low temperature for more analytical/factual responses
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq Analytics API Error:', errorText);
      return NextResponse.json({ error: 'Failed to generate insights from Groq' }, { status: 500 });
    }

    const data = await groqResponse.json();
    const insights = data.choices?.[0]?.message?.content || 'No insights could be generated at this time.';

    return NextResponse.json({ insights });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] API Error::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
