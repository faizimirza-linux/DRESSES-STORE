import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderEvents, payments } from "@/db/schema";
import { constructStripeEvent } from "@/lib/payments";

/**
 * Stripe webhook — set STRIPE_WEBHOOK_SECRET and point your endpoint to
 * /api/payments/stripe/webhook. Confirms the checkout session and promotes
 * the order to "confirmed / in stitching queue" instantly.
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = constructStripeEvent(await req.text(), signature);
  } catch (err) {
    console.error("[stripe webhook] signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (order && !order.advancePaid) {
        await db
          .update(payments)
          .set({
            status: "paid",
            paidAt: new Date(),
            txnRef: session.payment_intent?.toString() ?? session.id,
            sessionId: session.id,
            raw: session as never,
          })
          .where(eq(payments.orderId, orderId));
        await db
          .update(orders)
          .set({ status: "confirmed", advancePaid: true, paidAt: new Date(), updatedAt: new Date() })
          .where(eq(orders.id, orderId));
        await db.insert(orderEvents).values({
          orderId,
          status: "confirmed",
          note: `Stripe payment confirmed (${session.id}). Order confirmed — placed in the stitching queue.`,
        });
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await db
        .update(payments)
        .set({ status: "failed", raw: session as never })
        .where(eq(payments.orderId, orderId));
    }
  }

  return NextResponse.json({ received: true });
}
