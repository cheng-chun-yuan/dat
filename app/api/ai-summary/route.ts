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

  const { recentData } = await request.json();

  const openai = new OpenAI({ apiKey });

  const prompt = `You are a financial analyst specializing in Digital Asset Treasury (DAT) companies — public companies that hold Bitcoin on their balance sheets.

Analyze the following mNAV (Modified Net Asset Value) data for these companies. mNAV = Market Cap / (BTC Holdings × BTC Price). An mNAV > 1 means the market values the company at a premium to its Bitcoin holdings; mNAV < 1 means a discount.

Recent daily data (last 30 trading days):
${JSON.stringify(recentData, null, 2)}

Please provide:
1. **Overall Market Trend**: How are DAT company valuations trending relative to their BTC holdings?
2. **Per-Company Highlights**: Notable movements for each company.
3. **BTC Price Correlation**: How do mNAV changes relate to BTC price movements in this period?
4. **Key Insights**: Any interesting patterns, divergences, or notable observations.
5. **Outlook**: Based on current trends, what might investors watch for?

Keep the analysis concise but insightful. Use specific numbers from the data.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });

    const summary = completion.choices[0]?.message?.content || "No summary generated.";
    return NextResponse.json({ summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate summary: ${message}` },
      { status: 500 }
    );
  }
}
