import { createHash, randomInt } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { sendOtpEmail } from "./mailer";
import { rateLimit } from "./rate-limit";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

export type OtpPurpose = "verify" | "login" | "reset";

/**
 * Create + dispatch an OTP. Enforces per-email rate limits:
 *  - 1 request per 45 seconds
 *  - max 5 per hour per purpose
 */
export async function issueOtp(email: string, purpose: OtpPurpose) {
  const normalized = email.toLowerCase();

  const burst = rateLimit(`otp:burst:${purpose}:${normalized}`, 1, 45_000);
  if (!burst.ok) {
    return {
      ok: false as const,
      error: `Please wait ${burst.retryAfter}s before requesting another code.`,
    };
  }
  const hourly = rateLimit(`otp:hour:${purpose}:${normalized}`, 5, 60 * 60_000);
  if (!hourly.ok) {
    return {
      ok: false as const,
      error: "Too many code requests. Please try again later.",
    };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  await db.insert(otpCodes).values({
    email: normalized,
    codeHash: hashCode(normalized, code),
    purpose,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendOtpEmail(normalized, code, purpose);

  // In non-live delivery mode the code is returned so the demo/dev flow is testable.
  const devOtp = process.env.EMAIL_DELIVERY === "live" ? undefined : code;
  return { ok: true as const, devOtp };
}

/** Verify the most recent unconsumed OTP for an email/purpose. */
export async function verifyOtp(email: string, purpose: OtpPurpose, code: string) {
  const normalized = email.toLowerCase();

  const [row] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, normalized),
        eq(otpCodes.purpose, purpose),
        isNull(otpCodes.consumedAt),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!row) return { ok: false as const, error: "No active code. Request a new one." };
  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "Code expired. Request a new one." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, error: "Too many attempts. Request a new code." };
  }

  const matches = row.codeHash === hashCode(normalized, code);
  if (!matches) {
    await db
      .update(otpCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(otpCodes.id, row.id));
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return {
      ok: false as const,
      error: `Incorrect code.${left > 0 ? ` ${left} attempt${left === 1 ? "" : "s"} left.` : ""}`,
    };
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, row.id));

  return { ok: true as const };
}
