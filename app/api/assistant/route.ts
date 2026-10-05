import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fail, tooManyRequests } from "@/lib/api";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant/prompt";
import { createAssistantTools, type ShownPart } from "@/lib/assistant/tools";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Tool-using turns can take a while.
export const maxDuration = 60;

const requestSchema = z.object({
  // Plain text turns only: the browser never supplies tool calls or results.
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1500),
      })
    )
    .min(1)
    .max(24),
});

let client: Anthropic | null = null;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return fail(503, "دستیار هنوز راه‌اندازی نشده است.");
  }

  // Each message costs money: cap how fast one visitor can send them.
  const limit = rateLimit(`assistant:${getClientIp(request)}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return fail(400, "پیام نامعتبر است.");
  }

  client ??= new Anthropic();
  const shown = new Map<string, ShownPart>();

  try {
    const message = await client.beta.messages.toolRunner({
      model: "claude-opus-5-5",
      max_tokens: 8000,
      // Short conversational answers: low effort keeps replies quick and cheap.
      output_config: { effort: "low" },
      // If the model declines a request, the API retries it on a fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        {
          type: "text",
          text: ASSISTANT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: createAssistantTools(shown),
      messages: parsed.data.messages,
      max_iterations: 8,
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json({
        success: true,
        reply: "در این مورد نمی‌توانم کمک کنم. برای قطعات پارسیلون در خدمتم.",
        parts: [],
      });
    }

    const reply = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      success: true,
      reply:
        reply ||
        "پاسخ کامل نشد. لطفاً سؤال را کوتاه‌تر یا دوباره بپرسید.",
      parts: [...shown.values()],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return fail(429, "دستیار الان شلوغ است. چند لحظه بعد دوباره تلاش کنید.");
    }

    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Assistant: the Anthropic API key was rejected.");
      return fail(503, "دستیار هنوز راه‌اندازی نشده است.");
    }

    if (error instanceof Anthropic.APIError) {
      console.error(`Assistant: API error ${error.status}:`, error.message);
    } else {
      console.error("Assistant error:", error);
    }

    return fail(502, "دستیار پاسخ نداد. دوباره تلاش کنید.");
  }
}
