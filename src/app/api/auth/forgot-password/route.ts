import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { issueOtp } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({ email: z.email() });

export async function POST(req: Request) {
  const ip = rateLimit(`forgot:${clientIp(req)}`, 8, 60 * 60_000);
  if (!ip.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = body.data.email.toLowerCase();
  const message = "If an account exists for this email, a reset code is on its way.";

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return NextResponse.json({ ok: true, message });
  }

  const otp = await issueOtp(email, "reset");
  if (!otp.ok) return NextResponse.json({ error: otp.error }, { status: 429 });

  return NextResponse.json({ ok: true, message, devOtp: otp.devOtp });
}
