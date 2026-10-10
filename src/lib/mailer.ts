/**
 * Mail delivery abstraction.
 *
 * In production set EMAIL_DELIVERY=live and plug SMTP credentials into
 * `sendViaSmtp` (or swap in Resend / SendGrid). Until then, emails are
 * logged server-side and codes are surfaced through the dev channel so the
 * full OTP flow can be exercised end-to-end.
 */
export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: "verify" | "login" | "reset",
) {
  const subject =
    purpose === "reset"
      ? "DRESSES — password reset code"
      : purpose === "login"
        ? "DRESSES — your login code"
        : "DRESSES — verify your email";

  const body = [
    `Your DRESSES verification code is: ${code}`,
    "",
    "It expires in 10 minutes. If you didn't request it, ignore this email.",
  ].join("\n");

  if (process.env.EMAIL_DELIVERY === "live") {
    await sendViaSmtp(email, subject, body);
    return;
  }

  console.log(`\n[MAIL:outbox] To: ${email}\nSubject: ${subject}\n${body}\n`);
}

async function sendViaSmtp(to: string, subject: string, text: string) {
  // Hook up your provider here (Resend / SES / SMTP). Kept intentionally
  // small so real credentials never need to live in the repo.
  console.log(`[MAIL:live] would send to ${to} — ${subject}\n${text}`);
}
