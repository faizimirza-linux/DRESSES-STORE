import { createSecretKey } from "crypto";

/**
 * OAuth provider configuration (Google + Apple).
 *
 * Set the matching env vars to activate each provider:
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 *   APPLE_CLIENT_ID  / APPLE_CLIENT_SECRET (a signed ES256 client_secret JWT)
 *   NEXT_PUBLIC_BASE_URL (e.g. https://dresses.pk)
 */
export type OAuthProvider = "google" | "apple";

export function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  ).replace(/\/$/, "");
}

export function providerConfigured(provider: OAuthProvider) {
  if (provider === "google") {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
  return Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET);
}

export function buildAuthorizationUrl(provider: OAuthProvider, state: string) {
  const redirectUri = `${baseUrl()}/api/auth/oauth/${provider}/callback`;

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "name email",
    response_mode: "form_post",
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

export type OAuthProfile = {
  providerAccountId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export async function exchangeCodeForProfile(
  provider: OAuthProvider,
  code: string,
): Promise<OAuthProfile> {
  const redirectUri = `${baseUrl()}/api/auth/oauth/${provider}/callback`;

  if (provider === "google") {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!tokenRes.ok) throw new Error("Google token exchange failed");
    const tokens = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { authorization: `Bearer ${tokens.access_token}` }, cache: "no-store" },
    );
    if (!profileRes.ok) throw new Error("Google profile fetch failed");
    const profile = (await profileRes.json()) as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
    };
    return {
      providerAccountId: profile.sub,
      email: profile.email,
      name: profile.name ?? profile.email.split("@")[0],
      avatarUrl: profile.picture,
    };
  }

  // Apple
  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.APPLE_CLIENT_ID ?? "",
      client_secret: process.env.APPLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error("Apple token exchange failed");
  const tokens = (await tokenRes.json()) as { id_token: string };

  const [, payload] = tokens.id_token.split(".");
  const claims = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as { sub: string; email?: string };

  return {
    providerAccountId: claims.sub,
    email: claims.email ?? `${claims.sub}@privaterelay.appleid.com`,
    name: "Apple Customer",
  };
}

/** Guard against open redirects. */
export function safeNext(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/account";
  return next;
}

// Referenced so bundlers keep TLS pieces warm for the Apple flow on edge hosts.
export const _secret = () => createSecretKey(Buffer.from("dresses"));
