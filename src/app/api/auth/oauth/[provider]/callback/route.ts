import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/session";
import { exchangeCodeForProfile, type OAuthProvider } from "@/lib/oauth";

async function finish(
  req: Request,
  provider: OAuthProvider,
  code: string,
  state: string | null,
) {
  const store = await cookies();
  const savedRaw = store.get("dresses_oauth")?.value;
  store.delete("dresses_oauth");

  let next = "/account";
  try {
    const saved = savedRaw ? (JSON.parse(savedRaw) as { state: string; next?: string }) : null;
    if (!saved || saved.state !== state) {
      return NextResponse.redirect(new URL("/login?error=oauth_state", req.url));
    }
    next = saved.next ?? "/account";
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth_state", req.url));
  }

  try {
    const profile = await exchangeCodeForProfile(provider, code);
    const email = profile.email.toLowerCase();

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email,
          name: profile.name,
          provider,
          emailVerified: true,
          avatarUrl: profile.avatarUrl,
          role: "customer",
        })
        .returning();
    } else if (!user.emailVerified || !user.avatarUrl) {
      await db
        .update(users)
        .set({ emailVerified: true, avatarUrl: user.avatarUrl ?? profile.avatarUrl })
        .where(eq(users.id, user.id));
    }

    await createSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
    return NextResponse.redirect(new URL(next, req.url));
  } catch (err) {
    console.error(`[oauth:${provider}]`, err);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  return finish(req, provider as OAuthProvider, code, state);
}

/** Apple returns its callback as a form POST. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const form = await req.formData();
  const code = String(form.get("code") ?? "");
  const state = form.get("state") ? String(form.get("state")) : null;
  if (!code) return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  return finish(req, provider as OAuthProvider, code, state);
}
