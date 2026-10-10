import { NextResponse } from "next/server";
import { z } from "zod";
import { count, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderEvents, payments, products } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { BUSINESS } from "@/lib/business";

const itemSchema = z.object({
  productId: z.uuid(),
  size: z.string().min(1).max(24),
  quantity: z.number().int().min(1).max(5),
  measurements: z.record(z.string(), z.string().max(40)).optional(),
  stitchingNotes: z.string().max(500).optional(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1).max(20),
  shipping: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(10).max(20),
    city: z.string().min(2).max(120),
    address: z.string().min(5).max(500),
    note: z.string().max(500).optional(),
  }),
  provider: z.enum(["stripe", "jazzcash"]),
});

/**
 * Creates an order in `pending_payment` status.
 * Prices are ALWAYS recomputed server-side; the mandatory PKR 1,000 advance
 * rule is enforced here — the order never enters the stitching queue until
 * the payment gateway confirms it via /api/payments/callback.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
  }

  const ids = body.data.items.map((i) => i.productId);
  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, ids));

  const byId = new Map(dbProducts.filter((p) => p.active).map((p) => [p.id, p]));
  for (const item of body.data.items) {
    if (!byId.has(item.productId)) {
      return NextResponse.json({ error: "One of the designs is no longer available." }, { status: 400 });
    }
  }

  const subtotal = body.data.items.reduce(
    (sum, i) => sum + byId.get(i.productId)!.price * i.quantity,
    0,
  );
  const deliveryFee = BUSINESS.deliveryFee;
  const total = subtotal + deliveryFee;
  const advanceAmount = BUSINESS.advanceAmount; // mandatory PKR 1,000
  const balanceDue = Math.max(total - advanceAmount, 0);

  const [{ value: orderCount }] = await db.select({ value: count() }).from(orders);
  const orderNumber = `DR-${2500 + orderCount + 1}`;

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: user.sub,
      status: "pending_payment",
      subtotal,
      deliveryFee,
      total,
      advanceAmount,
      balanceDue,
      advancePaid: false,
      paymentProvider: body.data.provider,
      shippingName: body.data.shipping.name,
      shippingPhone: body.data.shipping.phone,
      shippingAddress: body.data.shipping.address,
      shippingCity: body.data.shipping.city,
      customerNote: body.data.shipping.note,
    })
    .returning();

  await db.insert(orderItems).values(
    body.data.items.map((i) => {
      const p = byId.get(i.productId)!;
      return {
        orderId: order.id,
        productId: p.id,
        productName: p.name,
        productImage: p.images[0] ?? null,
        unitPrice: p.price,
        quantity: i.quantity,
        size: i.size,
        measurements: i.measurements ?? null,
        stitchingNotes: i.stitchingNotes ?? null,
      };
    }),
  );

  await db.insert(payments).values({
    orderId: order.id,
    provider: body.data.provider,
    amount: advanceAmount,
    status: "pending",
  });

  await db.insert(orderEvents).values({
    orderId: order.id,
    status: "pending_payment",
    note: `Order placed. Awaiting ${BUSINESS.currency} ${advanceAmount.toLocaleString()} advance payment — stitching has not started yet.`,
  });

  return NextResponse.json({ ok: true, orderId: order.id, orderNumber });
}
