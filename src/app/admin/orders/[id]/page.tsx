import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Ruler, Phone, MapPin, CreditCard, Check } from "lucide-react";
import { db } from "@/db";
import { orders, orderItems, orderEvents, payments, users } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/business";
import { formatPKR, formatDateTime } from "@/lib/utils";
import { STATUS_STYLES } from "../../../account/page";
import { OrderStatusControl } from "@/components/admin/order-status-control";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order Detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();

  const [customer] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, order.userId))
    .limit(1);

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const events = await db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, order.id))
    .orderBy(asc(orderEvents.createdAt));
  const [payment] = await db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-burgundy">
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="mt-1 font-display text-4xl font-medium text-ink md:text-5xl">
            #{order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {formatDateTime(order.createdAt)} · {customer?.name ?? "Customer"} ({customer?.email})
          </p>
        </div>
        <span className={`status-pill ${STATUS_STYLES[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* items w/ measurements */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
              <Ruler className="h-5 w-5 text-burgundy" /> Pieces & measurements
            </h2>
            <div className="mt-4 space-y-4">
              {items.map((it) => (
                <div key={it.id} className="flex gap-4 rounded-xl border border-ink/10 p-4">
                  {it.productImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.productImage} alt="" className="h-24 w-20 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="font-bold text-ink">{it.productName} × {it.quantity}</p>
                      <p className="font-semibold">{formatPKR(it.unitPrice * it.quantity)}</p>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">Size: <b>{it.size}</b></p>
                    {it.measurements && Object.values(it.measurements).some(Boolean) ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Object.entries(it.measurements)
                          .filter(([k, v]) => v && k !== "notes")
                          .map(([k, v]) => (
                            <div key={k} className="rounded-lg bg-blush/70 px-3 py-2">
                              <p className="text-[9px] font-bold tracking-wider text-burgundy uppercase">{k}</p>
                              <p className="text-sm font-bold text-ink">{v}&quot;</p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-ink/40">Standard size — no custom measurements.</p>
                    )}
                    {it.stitchingNotes && (
                      <p className="mt-3 rounded-lg bg-ivory p-3 text-xs text-ink/70 italic">
                        “{it.stitchingNotes}”
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* timeline */}
          <div className="card p-6">
            <h2 className="font-display text-2xl font-medium text-ink">History</h2>
            <ol className="mt-4 space-y-0">
              {events.map((e, i) => (
                <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < events.length - 1 && <span className="absolute top-7 left-[13px] h-full w-px bg-ink/10" />}
                  <span className={`z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ${i === events.length - 1 ? "bg-burgundy text-cream" : "bg-blush text-burgundy"}`}>
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{ORDER_STATUS_LABELS[e.status] ?? e.status}</p>
                    {e.note && <p className="text-xs text-ink-soft">{e.note}</p>}
                    <p className="text-[11px] text-ink/40">{formatDateTime(e.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* side column */}
        <div className="space-y-6">
          <OrderStatusControl orderId={order.id} current={order.status} advancePaid={order.advancePaid} />

          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
              <CreditCard className="h-5 w-5 text-burgundy" /> Payment
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-ink-soft"><dt>Total</dt><dd className="font-bold text-ink">{formatPKR(order.total)}</dd></div>
              <div className="flex justify-between text-ink-soft">
                <dt>Advance</dt>
                <dd className={`font-bold ${order.advancePaid ? "text-emerald-700" : "text-amber-700"}`}>
                  {formatPKR(order.advanceAmount)} {order.advancePaid ? "· paid" : "· pending"}
                </dd>
              </div>
              <div className="flex justify-between text-ink-soft"><dt>Balance COD</dt><dd className="font-semibold text-ink">{formatPKR(order.balanceDue)}</dd></div>
              <div className="flex justify-between text-xs text-ink/50"><dt>Gateway</dt><dd className="capitalize">{payment?.provider ?? order.paymentProvider ?? "—"}</dd></div>
              {payment?.txnRef && <div className="flex justify-between text-xs text-ink/50"><dt>Txn ref</dt><dd>{payment.txnRef}</dd></div>}
              {payment?.paidAt && <div className="flex justify-between text-xs text-ink/50"><dt>Paid at</dt><dd>{formatDateTime(payment.paidAt)}</dd></div>}
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
              <MapPin className="h-5 w-5 text-burgundy" /> Delivery
            </h2>
            <p className="mt-3 text-sm font-bold text-ink">{order.shippingName}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {order.shippingAddress}, {order.shippingCity}
            </p>
            <a href={`tel:${order.shippingPhone}`} className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-bold text-ink transition-colors hover:border-burgundy hover:text-burgundy">
              <Phone className="h-3.5 w-3.5" /> {order.shippingPhone}
            </a>
            {order.customerNote && (
              <p className="mt-3 rounded-lg bg-ivory p-3 text-xs text-ink/60 italic">“{order.customerNote}”</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
