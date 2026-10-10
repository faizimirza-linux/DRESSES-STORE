import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
});

export async function POST(req: Request) {
  const rl = rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many messages. Please WhatsApp us instead." }, { status: 429 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Please complete all fields (message 10+ characters)." }, { status: 400 });
  }

  await db.insert(contactMessages).values({
    name: body.data.name,
    email: body.data.email.toLowerCase(),
    phone: body.data.phone,
    message: body.data.message,
  });

  return NextResponse.json({ ok: true });
}
