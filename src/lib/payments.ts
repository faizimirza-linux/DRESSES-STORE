import { createHmac } from "crypto";
import Stripe from "stripe";
import { BUSINESS } from "./business";
import { baseUrl } from "./oauth";

/* --------------------------------- stripe --------------------------------- */

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create a Stripe Checkout Session for the mandatory advance deposit.
 * Returns null when Stripe isn't configured (sandbox simulator is used instead).
 */
export async function createStripeCheckout(opts: {
  orderId: string;
  orderNumber: string;
  amountPKR: number;
  email: string;
}) {
  if (!stripeConfigured()) return null;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const url = baseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: opts.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "pkr",
          unit_amount: opts.amountPKR * 100, // paisa
          product_data: {
            name: `${BUSINESS.name} — Stitching Advance (${opts.orderNumber})`,
            description:
              "Mandatory advance deposit. Remaining balance is collected on delivery.",
          },
        },
      },
    ],
    metadata: { orderId: opts.orderId, orderNumber: opts.orderNumber },
    success_url: `${url}/payment/${opts.orderId}?session=success`,
    cancel_url: `${url}/payment/${opts.orderId}?session=cancelled`,
  });

  return session.url;
}

export function constructStripeEvent(payload: string, signature: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}

/* -------------------------------- jazzcash -------------------------------- */

export function jazzcashConfigured() {
  return Boolean(
    process.env.JAZZCASH_MERCHANT_ID &&
      process.env.JAZZCASH_PASSWORD &&
      process.env.JAZZCASH_INTEGRITY_SALT,
  );
}

function txnDateTime(date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  );
}

/**
 * Build a signed JazzCash sandbox/production payment request for the
 * mandatory advance deposit. Hash = HMAC_SHA256(salt + "&" + sorted values).
 */
export function buildJazzCashRequest(opts: {
  orderId: string;
  orderNumber: string;
  amountPKR: number;
}) {
  const url = baseUrl();
  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60_000);

  const fields: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID ?? "",
    pp_Password: process.env.JAZZCASH_PASSWORD ?? "",
    pp_TxnRefNo: `T${now.getTime()}`,
    pp_Amount: String(opts.amountPKR * 100),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: txnDateTime(now),
    pp_TxnExpiryDateTime: txnDateTime(expiry),
    pp_BillReference: opts.orderNumber,
    pp_Description: `${BUSINESS.name} stitching advance`,
    pp_IsRegisteredCustomer: "No",
    ppmpf_1: opts.orderId,
    pp_ReturnURL: `${url}/api/payments/callback?provider=jazzcash`,
  };

  const salt = process.env.JAZZCASH_INTEGRITY_SALT ?? "";
  const sorted = Object.keys(fields)
    .filter((k) => fields[k] !== "")
    .sort()
    .map((k) => fields[k]);
  const stringToHash = `${salt}&${sorted.join("&")}`;
  fields.pp_SecureHash = createHmac("sha256", salt).update(stringToHash).digest("hex");

  const postUrl =
    process.env.JAZZCASH_SANDBOX === "false"
      ? "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
      : "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";

  return { postUrl, fields };
}

/** Verify a JazzCash callback's secure hash. */
export function verifyJazzCashHash(fields: Record<string, string>) {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT ?? "";
  const received = fields.pp_SecureHash ?? "";
  const sorted = Object.keys(fields)
    .filter((k) => k !== "pp_SecureHash" && fields[k] !== "")
    .sort()
    .map((k) => fields[k]);
  const computed = createHmac("sha256", salt)
    .update(`${salt}&${sorted.join("&")}`)
    .digest("hex");
  return computed.toLowerCase() === received.toLowerCase();
}

/* --------------------------------- sandbox -------------------------------- */

/** True when no live gateway keys exist — the built-in simulator handles checkout. */
export function sandboxMode(provider: "stripe" | "jazzcash") {
  return provider === "stripe" ? !stripeConfigured() : !jazzcashConfigured();
}
