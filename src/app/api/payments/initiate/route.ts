import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import {
  buildJazzCashRequest,
  createStripeCheckout,
  jazzcashConfigured,
} from "@/lib/payments";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  orderId: z.uuid(),
  provider: z.enum(["stripe", "jazzcash"]),
});

/**
 * Starts the PKR 1,000 advance payment for an order that is still
 * `pending_payment`. Returns either a redirect (Stripe Checkout), a signed
 * auto-post form (JazzCash), or the local sandbox simulator URL when no live
 * gateway keys are configured.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`payinit:${clientIp(req)}`, 20, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const [order] = await db.select().from(orders).where(eq(orders.id, body.data.orderId)).limit(1);
  if (!order || (order.userId !== user.sub && user.role !== "admin")) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.advancePaid) {
    return NextResponse.json({ error: "This order's advance is already paid." }, { status: 400 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "Order is not awaiting payment." }, { status: 400 });
  }

  const provider = body.data.provider;
  await db.update(orders).set({ paymentProvider: provider }).where(eq(orders.id, order.id));
  await db.update(payments).set({ provider }).where(eq(payments.orderId, order.id));

  if (provider === "stripe") {
    const url = await createStripeCheckout({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPKR: order.advanceAmount,
      email: user.email,
    });
    if (url) return NextResponse.json({ type: "redirect", url });
  }

  if (provider === "jazzcash" && jazzcashConfigured()) {
    const { postUrl, fields } = buildJazzCashRequest({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPKR: order.advanceAmount,
    });
    return NextResponse.json({ type: "jazzcash_form", postUrl, fields });
  }

  // No live keys — the built-in gateway simulator completes the same callback flow.
  await db.update(payments).set({ provider: "sandbox" }).where(eq(payments.orderId, order.id));
  return NextResponse.json({ type: "sandbox", url: `/payment/${order.id}` });
}
