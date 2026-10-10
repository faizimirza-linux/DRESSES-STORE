import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderEvents, payments } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { verifyJazzCashHash } from "@/lib/payments";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Marks an advance payment as settled and moves the order into the stitching
 * queue. Idempotent — safe for gateway retries.
 */
async function markPaid(orderId: string, txnRef: string | null, raw?: unknown) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { error: "Order not found." } as const;
  if (order.advancePaid) return { ok: true as const, alreadyPaid: true };

  await db
    .update(payments)
    .set({ status: "paid", paidAt: new Date(), txnRef, raw: raw as never })
    .where(eq(payments.orderId, orderId));

  await db
    .update(orders)
    .set({
      status: "confirmed",
      advancePaid: true,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  await db.insert(orderEvents).values({
    orderId,
    status: "confirmed",
    note: `Advance payment received (ref ${txnRef ?? "—"}). Order confirmed — placed in the stitching queue.`,
  });

  return { ok: true as const };
}

async function markFailed(orderId: string, txnRef: string | null, raw?: unknown) {
  await db
    .update(payments)
    .set({ status: "failed", txnRef, raw: raw as never })
    .where(eq(payments.orderId, orderId));
}

export async function POST(req: Request) {
  const url = new URL(req.url);

  /* --------------------------- JazzCash gateway --------------------------- */
  if (url.searchParams.get("provider") === "jazzcash") {
    const form = await req.formData();
    const fields: Record<string, string> = {};
    form.forEach((v, k) => (fields[k] = String(v)));

    const orderId = fields.ppmpf_1;
    if (!orderId || !verifyJazzCashHash(fields)) {
      return NextResponse.redirect(new URL("/account?payment=invalid", req.url), 303);
    }
    if (fields.pp_ResponseCode === "000") {
      await markPaid(orderId, fields.pp_TxnRefNo ?? fields.pp_RetreivalReferenceNo ?? null, fields);
      return NextResponse.redirect(new URL(`/payment/${orderId}?session=success`, req.url), 303);
    }
    await markFailed(orderId, fields.pp_TxnRefNo ?? null, fields);
    return NextResponse.redirect(new URL(`/payment/${orderId}?session=cancelled`, req.url), 303);
  }

  /* ----------------------- sandbox simulator / retries --------------------- */
  const rl = rateLimit(`paycb:${clientIp(req)}`, 30, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    orderId?: string;
    status?: string;
    txnRef?: string;
  } | null;

  if (!body?.orderId || !["paid", "failed"].includes(body.status ?? "")) {
    return NextResponse.json({ error: "Invalid callback payload." }, { status: 400 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1);
  if (!order || (order.userId !== user.sub && user.role !== "admin")) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (body.status === "failed") {
    await markFailed(order.id, body.txnRef ?? null, body);
    return NextResponse.json({ ok: true });
  }

  const result = await markPaid(order.id, body.txnRef ?? null, body);
  if ("error" in result) return NextResponse.json(result, { status: 404 });
  return NextResponse.json({ ok: true, txnRef: body.txnRef });
}
