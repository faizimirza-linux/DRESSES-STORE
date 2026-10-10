import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  Ruler,
  MapPin,
  CreditCard,
  ShieldCheck,
  Check,
} from "lucide-react";
import { db } from "@/db";
import { orders, orderItems, orderEvents, payments } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { BUSINESS, ORDER_STATUS_LABELS } from "@/lib/business";
import { formatPKR, formatDateTime } from "@/lib/utils";
import { STATUS_STYLES } from "../../page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order Tracking" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/account/orders/${id}`);

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order || (order.userId !== user.sub && user.role !== "admin")) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const events = await db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, order.id))
    .orderBy(asc(orderEvents.createdAt));
  const [payment] = await db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);

  const flow = BUSINESS.orderStatusFlow;
  const isCancelled = order.status === "cancelled";
  const currentIdx = flow.indexOf(order.status as (typeof flow)[number]);

  return (
    <div className="mx-auto max-w-5xl px-5 pt-40 pb-24 md:px-8 md:pt-44">
      <Link href="/account" className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-burgundy">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to account
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Order tracking</p>
          <h1 className="mt-2 font-display text-5xl font-medium text-ink">
            #{order.orderNumber}
          </h1>
        </div>
        <span className={`status-pill ${STATUS_STYLES[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {order.status === "pending_payment" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-6 py-5">
          <p className="text-sm font-semibold text-amber-900">
            This order is waiting for its {formatPKR(order.advanceAmount)} advance — stitching
            hasn't started yet.
          </p>
          <Link href={`/payment/${order.id}`} className="btn-primary px-6 py-2.5 text-xs">
            Complete Payment
          </Link>
        </div>
      )}

      {/* progress rail */}
      {!isCancelled && (
        <div className="card mt-8 p-7">
          <div className="flex items-center">
            {flow.map((s, i) => {
              const done = currentIdx >= 0 && i <= currentIdx;
              return (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full border-2 text-[10px] font-black transition-colors ${
                        done ? "border-burgundy bg-burgundy text-cream" : "border-ink/15 text-ink/30"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className={`mt-2 hidden text-center text-[9px] font-bold tracking-wide uppercase sm:block ${done ? "text-burgundy" : "text-ink/35"}`}>
                      {ORDER_STATUS_LABELS[s].split(" / ")[0].split(" ")[0]}
                    </span>
                  </div>
                  {i < flow.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 rounded ${i < currentIdx ? "bg-burgundy" : "bg-ink/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* items + timeline */}
        <div className="space-y-6">
          <div className="card p-7">
            <h2 className="font-display text-2xl font-medium text-ink">Your pieces</h2>
            <div className="mt-4 space-y-4">
              {items.map((it) => (
                <div key={it.id} className="flex gap-4 rounded-xl border border-ink/10 p-4">
                  {it.productImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.productImage} alt="" className="h-20 w-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-bold text-ink">{it.productName} × {it.quantity}</p>
                      <p className="text-sm font-semibold">{formatPKR(it.unitPrice * it.quantity)}</p>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">Size: <b>{it.size}</b></p>
                    {it.measurements && Object.values(it.measurements).some(Boolean) && (
                      <div className="mt-2 rounded-lg bg-blush/60 p-3">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-burgundy uppercase">
                          <Ruler className="h-3 w-3" /> Custom measurements (in)
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                          {Object.entries(it.measurements)
                            .filter(([k, v]) => v && k !== "notes")
                            .map(([k, v]) => (
                              <span key={k}><b className="capitalize">{k}</b>: {v}"</span>
                            ))}
                        </div>
                      </div>
                    )}
                    {it.stitchingNotes && (
                      <p className="mt-2 text-xs text-ink/60 italic">“{it.stitchingNotes}”</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* timeline */}
          <div className="card p-7">
            <h2 className="font-display text-2xl font-medium text-ink">Timeline</h2>
            <ol className="mt-5 space-y-0">
              {events.map((e, i) => (
                <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < events.length - 1 && (
                    <span className="absolute top-8 left-[15px] h-full w-px bg-ink/10" />
                  )}
                  <span className={`z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ${i === events.length - 1 ? "bg-burgundy text-cream" : "bg-blush text-burgundy"}`}>
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{ORDER_STATUS_LABELS[e.status] ?? e.status}</p>
                    {e.note && <p className="text-xs text-ink-soft">{e.note}</p>}
                    <p className="mt-0.5 text-[11px] text-ink/40">{formatDateTime(e.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* payment + shipping */}
        <div className="space-y-6">
          <div className="card p-7">
            <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
              <CreditCard className="h-5 w-5 text-burgundy" /> Payment
            </h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink">{formatPKR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>Delivery</dt>
                <dd className="font-semibold text-ink">{formatPKR(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between font-bold text-ink">
                <dt>Total</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                <dt className="font-semibold">Advance {order.advancePaid ? "paid" : "due"}</dt>
                <dd className="font-bold">{formatPKR(order.advanceAmount)}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>Balance (COD)</dt>
                <dd className="font-semibold text-ink">{formatPKR(order.balanceDue)}</dd>
              </div>
              {payment?.txnRef && (
                <div className="flex justify-between text-xs text-ink/50">
                  <dt>Txn ref</dt>
                  <dd>{payment.txnRef}</dd>
                </div>
              )}
              <div className="flex justify-between text-xs text-ink/50">
                <dt>Method</dt>
                <dd className="capitalize">{payment?.provider ?? order.paymentProvider ?? "—"}</dd>
              </div>
            </dl>
            {order.advancePaid && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-ivory px-3 py-2.5 text-[11px] leading-relaxed text-ink-soft">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-burgundy" />
                Advance verified via {payment?.provider ?? "gateway"} callback. Keep{" "}
                {formatPKR(order.balanceDue)} ready for the courier.
              </p>
            )}
          </div>

          <div className="card p-7">
            <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
              <MapPin className="h-5 w-5 text-burgundy" /> Delivery
            </h2>
            <p className="mt-4 text-sm font-bold text-ink">{order.shippingName}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {order.shippingAddress}
              <br />
              {order.shippingCity} · {order.shippingPhone}
            </p>
            {order.customerNote && (
              <p className="mt-3 rounded-lg bg-ivory p-3 text-xs text-ink/60 italic">“{order.customerNote}”</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
