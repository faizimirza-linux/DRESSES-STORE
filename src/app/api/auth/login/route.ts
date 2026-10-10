import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { issueOtp } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = rateLimit(`login:${clientIp(req)}`, 15, 15 * 60_000);
  if (!ip.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const email = body.data.email.toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: user && !user.passwordHash ? "This account uses social sign-in." : "Invalid email or password." },
      { status: 401 },
    );
  }

  if (!verifyPassword(body.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const otp = await issueOtp(email, "login");
  if (!otp.ok) return NextResponse.json({ error: otp.error }, { status: 429 });

  return NextResponse.json({ ok: true, otpRequired: true, devOtp: otp.devOtp });
}
