import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  buildAuthorizationUrl,
  providerConfigured,
  safeNext,
  type OAuthProvider,
} from "@/lib/oauth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "apple") {
    return NextResponse.redirect(new URL("/login?error=oauth_not_configured", req.url));
  }

  if (!providerConfigured(provider as OAuthProvider)) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_configured", req.url));
  }

  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const state = randomBytes(16).toString("hex");

  const res = NextResponse.redirect(
    buildAuthorizationUrl(provider as OAuthProvider, state),
  );
  res.cookies.set("dresses_oauth", JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
