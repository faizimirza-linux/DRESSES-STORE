import { NextResponse } from "next/server";
import { z } from "zod";
import { answerAssistant } from "@/lib/assistant";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1200),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const rl = rateLimit(`chat:${clientIp(req)}`, 24, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You're chatting faster than my needle! Try again in a minute.", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const reply = await answerAssistant(body.data.messages);
  return NextResponse.json({ reply });
}
