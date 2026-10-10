import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyOtp } from "@/lib/otp";
import { createSession, createResetToken } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.email(),
  code: z.string().length(6).regex(/^\d+$/),
  purpose: z.enum(["verify", "login", "reset"]),
});

export async function POST(req: Request) {
  const ip = rateLimit(`verify:${clientIp(req)}`, 30, 15 * 60_000);
  if (!ip.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }

  const email = body.data.email.toLowerCase();
  const result = await verifyOtp(email, body.data.purpose, body.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (body.data.purpose === "reset") {
    const resetToken = await createResetToken(email);
    return NextResponse.json({ ok: true, resetToken });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Account not found. Please register first." }, { status: 404 });
  }

  if (!user.emailVerified) {
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id));
  }

  await createSession({ sub: user.id, email: user.email, name: user.name, role: user.role });

  return NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email, role: user.role },
  });
}
