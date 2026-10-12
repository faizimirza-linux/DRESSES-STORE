/**
 * Transactional email delivery for OTP verification, login, and password reset.
 * Brevo credentials are read only from Netlify environment variables.
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

  const text = [
    `Your DRESSES verification code is: ${code}`,
    "",
    "It expires in 10 minutes. If you didn't request it, ignore this email.",
  ].join("\n");

  if (process.env.EMAIL_DELIVERY === "live") {
    await sendViaBrevo(email, subject, text);
    return;
  }

  console.log(`\n[MAIL:outbox] To: ${email}\nSubject: ${subject}\n${text}\n`);
}

function parseSender(value: string) {
  const match = value.match(/^(.+?)\\s*<([^<>]+)>$/);
  return match ? { name: match[1].trim(), email: match[2].trim() } : { email: value.trim() };
}

async function sendViaBrevo(to: string, subject: string, textContent: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromValue = process.env.EMAIL_FROM;
  if (!apiKey || !fromValue) {
    throw new Error("Email delivery is not configured. Set BREVO_API_KEY and EMAIL_FROM.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: parseSender(fromValue),
      to: [{ email: to }],
      subject,
      textContent,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Brevo rejected an email", response.status, detail.slice(0, 300));
    throw new Error("We could not send that email right now. Please try again shortly.");
  }
}
