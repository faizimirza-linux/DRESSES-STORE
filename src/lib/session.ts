import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dresses-dev-secret-change-me-in-production",
);

export const SESSION_COOKIE = "dresses_session";
const SESSION_DAYS = 7;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "customer";
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "admin" | "customer",
    };
  } catch {
    return null;
  }
}

/** Current session user (cached per request). */
export const getSessionUser = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

/** Short-lived signed token for password reset after OTP verification. */
export async function createResetToken(email: string) {
  return new SignJWT({ email, purpose: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(SECRET);
}

export async function verifyResetToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== "reset" || !payload.email) return null;
    return payload.email as string;
  } catch {
    return null;
  }
}
