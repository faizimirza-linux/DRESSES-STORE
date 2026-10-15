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

export type NewOrderEmail = {
  orderNumber: string;
  total: number;
  advanceAmount: number;
  shipping: { name: string; phone: string; city: string; address: string; note?: string | null };
  items: Array<{ productName: string; quantity: number; size: string; unitPrice: number; measurements?: Record<string, string> | null; stitchingNotes?: string | null }>;
};

/** Send a compact owner notification when a new order is saved. */
export async function sendNewOrderEmail(order: NewOrderEmail) {
  const to = (process.env.ORDER_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? "mirzamuhammadfaizan0@gmail.com").trim();
  const lines = [
    `New DRESSES order #${order.orderNumber}`,
    "",
    ...order.items.map((item, index) => {
      const measurements = item.measurements
        ? Object.entries(item.measurements).filter(([, value]) => Boolean(value)).map(([key, value]) => `${key}: ${value}`).join(", ")
        : "";
      return [`${index + 1}. ${item.productName} — size ${item.size} × ${item.quantity} (PKR ${item.unitPrice.toLocaleString("en-PK")} each)`, measurements ? `Measurements: ${measurements}` : "", item.stitchingNotes ? `Stitching note: ${item.stitchingNotes}` : ""].filter(Boolean).join("\n");
    }),
    "",
    `Order total: PKR ${order.total.toLocaleString("en-PK")}`,
    `Advance due: PKR ${order.advanceAmount.toLocaleString("en-PK")}`,
    `Customer: ${order.shipping.name}`,
    `Phone: ${order.shipping.phone}`,
    `Delivery: ${order.shipping.address}, ${order.shipping.city}`,
    order.shipping.note ? `Note: ${order.shipping.note}` : "",
    "Payment is pending manual wallet verification.",
  ].filter(Boolean).join("\n");
  if (process.env.EMAIL_DELIVERY !== "live") {
    console.log(`[MAIL:order-outbox] To: ${to}\n${lines}`);
    return { status: "skipped" as const, reason: "email_delivery_not_live" };
  }
  await sendViaBrevo(to, `New DRESSES order #${order.orderNumber}`, lines);
  return { status: "sent" as const };
}

function parseSender(value: string) {
  const match = value.match(/^(.+?)\s*<([^<>]+)>$/);
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
