"use client";

import { useState, useRef, useEffect } from "react";
import { HistoryEntry, HoldingsData } from "@/lib/types";
import { COMPANY_TICKERS } from "@/lib/constants";

interface AIChatbotProps {
  history: HistoryEntry[];
  holdings: HoldingsData;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildDataContext(history: HistoryEntry[], holdings: HoldingsData): string {
  const latest = history[history.length - 1];
  if (!latest) return "No data available.";

  const lines: string[] = [];
  lines.push(`Date: ${latest.date}`);
  lines.push(`BTC Price: $${latest.btc_price.toLocaleString()}`);
  lines.push("");
  lines.push("Current mNAV values:");

  for (const ticker of COMPANY_TICKERS) {
    const company = latest.companies[ticker];
    const holding = holdings[ticker];
    if (!company || !holding) continue;
    lines.push(
      `  ${ticker} (${holding.name}): mNAV=${company.mnav.toFixed(4)}, Stock=$${company.stock_price.toFixed(2)}, MarketCap=$${(company.market_cap / 1e9).toFixed(2)}B, BTC Holdings=${company.btc_holdings.toLocaleString()}`
    );
  }

  // Add recent trend (last 5 days)
  const recent = history.slice(-5);
  if (recent.length > 1) {
    lines.push("");
    lines.push("Recent 5-day trend:");
    for (const entry of recent) {
      const mnavs = COMPANY_TICKERS
        .filter((t) => entry.companies[t])
        .map((t) => `${t}:${entry.companies[t].mnav.toFixed(2)}`);
      lines.push(`  ${entry.date} | BTC:$${entry.btc_price.toLocaleString()} | ${mnavs.join(", ")}`);
    }
  }

  return lines.join("\n");
}

export default function AIChatbot({ history, holdings }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const dataContext = buildDataContext(history, holdings);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          dataContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.error || "Something went wrong." },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Failed to connect to the AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent-positive text-bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-positive animate-pulse" />
            <span className="text-text-primary font-semibold text-sm">
              AI mNAV Assistant
            </span>
            <span className="text-text-secondary text-xs ml-auto">
              Powered by GPT-4o-mini
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-text-secondary text-sm text-center py-8">
                <p className="mb-3">Ask me anything about the mNAV data!</p>
                <div className="space-y-2">
                  {[
                    "Which company has the highest mNAV?",
                    "How does BTC price affect mNAV?",
                    "Summarize the current market trend",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-xs bg-bg-primary hover:bg-border rounded-lg px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-accent-positive/20 text-text-primary"
                      : "bg-bg-primary text-text-secondary border border-border"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-bg-primary border border-border rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-accent-positive/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-accent-positive/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-accent-positive/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            id="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 border-t border-border flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about mNAV data..."
              className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-positive/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-accent-positive/15 text-accent-positive rounded-lg text-sm font-medium hover:bg-accent-positive/25 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
