import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null });

  const [user] = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  return NextResponse.json({
    user: { ...session, phone: user?.phone ?? null },
  });
}
