import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

/** Polled by the payment page while a live gateway confirms the transaction. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || (order.userId !== user.sub && user.role !== "admin")) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);

  return NextResponse.json({
    advancePaid: order.advancePaid,
    status: order.status,
    txnRef: payment?.txnRef ?? null,
  });
}
