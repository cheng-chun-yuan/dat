import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { messages, dataContext } = await request.json();

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are an AI financial analyst assistant for the DAT.co mNAV Monitor dashboard. You specialize in Digital Asset Treasury (DAT) companies — public companies that hold Bitcoin on their balance sheets.

You have access to the current dashboard data:

${dataContext}

Key concepts:
- mNAV (Modified Net Asset Value) = Market Cap / (BTC Holdings × BTC Price)
- mNAV > 1 means premium (market values company above its BTC holdings)
- mNAV < 1 means discount (market values company below its BTC holdings)
- Companies tracked: MSTR (MicroStrategy), MARA (Marathon Digital), RIOT (Riot Platforms), COIN (Coinbase), CLSK (CleanSpark), HIVE (HIVE Digital)

Answer questions about the data concisely. Use specific numbers when available. If asked about data you don't have, say so.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || "No response generated.";
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate response: ${message}` },
      { status: 500 }
    );
  }
}
