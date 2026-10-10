import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { issueOtp } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const ip = rateLimit(`register:${clientIp(req)}`, 10, 60 * 60_000);
  if (!ip.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { error: "Please provide a name, valid email and an 8+ character password." },
      { status: 400 },
    );
  }

  const email = body.data.email.toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing?.emailVerified) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try signing in." },
      { status: 409 },
    );
  }

  const passwordHash = hashPassword(body.data.password);
  if (existing) {
    await db
      .update(users)
      .set({ name: body.data.name, passwordHash, provider: "email" })
      .where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      email,
      name: body.data.name,
      passwordHash,
      role: "customer",
      provider: "email",
      emailVerified: false,
    });
  }

  const otp = await issueOtp(email, "verify");
  if (!otp.ok) return NextResponse.json({ error: otp.error }, { status: 429 });

  return NextResponse.json({ ok: true, otpRequired: true, devOtp: otp.devOtp });
}
