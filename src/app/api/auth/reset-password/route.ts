import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { verifyResetToken } from "@/lib/session";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const email = await verifyResetToken(body.data.token);
  if (!email) {
    return NextResponse.json(
      { error: "Reset session expired. Please request a new code." },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(body.data.password), emailVerified: true })
    .where(eq(users.email, email.toLowerCase()));

  return NextResponse.json({ ok: true });
}
