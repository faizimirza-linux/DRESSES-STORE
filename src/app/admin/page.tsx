import Link from "next/link";
import { desc, inArray, sql } from "drizzle-orm";
import {
  ShoppingBag,
  Scissors,
  Banknote,
  Package,
  Star,
  MessageSquare,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { db } from "@/db";
import { orders, orderItems, users, reviews, contactMessages, products } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/business";
import { formatPKR, formatDate } from "@/lib/utils";
import { STATUS_STYLES } from "../account/page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Overview" };

export default async function AdminDashboard() {
  const [orderStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where status = 'pending_payment')::int`,
      queue: sql<number>`count(*) filter (where status in ('confirmed','stitching','ready'))::int`,
      advanceSum: sql<number>`coalesce(sum(advance_amount) filter (where advance_paid), 0)::int`,
      revenue: sql<number>`coalesce(sum(total) filter (where advance_paid), 0)::int`,
    })
    .from(orders);

  const [customerStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const [productStats] = await db
    .select({ count: sql<number>`count(*)::int`, active: sql<number>`count(*) filter (where active)::int` })
    .from(products);
  const [reviewStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews);
  const [msgStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactMessages);

  const byStatus = await db
    .select({ status: orders.status, count: sql<number>`count(*)::int` })
    .from(orders)
    .groupBy(orders.status);

  const recent = await db
    .select({
      order: orders,
      customer: users.name,
      email: users.email,
    })
    .from(orders)
    .leftJoin(users, sql`${orders.userId} = ${users.id}`)
    .orderBy(desc(orders.createdAt))
    .limit(6);

  const recentItems = recent.length
    ? await db
        .select({ orderId: orderItems.orderId, name: orderItems.productName, size: orderItems.size, quantity: orderItems.quantity })
        .from(orderItems)
        .where(inArray(orderItems.orderId, recent.map(({ order }) => order.id)))
    : [];
  const recentItemSummaries = new Map<string, string[]>();
  for (const item of recentItems) {
    const summary = recentItemSummaries.get(item.orderId) ?? [];
    summary.push(`${item.name} · ${item.size} × ${item.quantity}`);
    recentItemSummaries.set(item.orderId, summary);
  }

  // Measurements attached — a quick glance at the stitching queue
  const queueItems = await db
    .select({
      item: orderItems,
      orderNumber: orders.orderNumber,
      status: orders.status,
    })
    .from(orderItems)
    .innerJoin(orders, sql`${orderItems.orderId} = ${orders.id}`)
    .where(sql`${orders.status} in ('confirmed','stitching')`)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const maxStatus = Math.max(1, ...byStatus.map((s) => s.count));

  const stats = [
    { label: "Advance collected", value: formatPKR(orderStats?.advanceSum ?? 0), icon: Banknote, tone: "bg-emerald-100 text-emerald-800" },
    { label: "Orders awaiting payment", value: String(orderStats?.pending ?? 0), icon: Clock, tone: "bg-amber-100 text-amber-800" },
    { label: "In stitching queue", value: String(orderStats?.queue ?? 0), icon: Scissors, tone: "bg-sky-100 text-sky-800" },
    { label: "Lifetime order value", value: formatPKR(orderStats?.revenue ?? 0), icon: ShoppingBag, tone: "bg-blush text-burgundy" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Owner Studio</p>
          <h1 className="mt-2 font-display text-4xl font-medium text-ink md:text-5xl">
            Studio <span className="display-italic text-burgundy">overview</span>
          </h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary px-6 py-3 text-xs">
          Add New Dress <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* stat cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-6">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-2xl font-semibold text-ink md:text-3xl">{s.value}</p>
            <p className="mt-1 text-[11px] font-bold tracking-wider text-ink-soft uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-medium text-ink">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-burgundy link-underline">
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-ink/8">
            {recent.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-soft">No orders yet — share your shop link.</p>
            )}
            {recent.map(({ order, customer, email }) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="group flex flex-wrap items-center justify-between gap-3 py-3.5"
              >
                <div>
                  <p className="text-sm font-bold text-ink group-hover:text-burgundy">#{order.orderNumber}</p>
                  <p className="text-xs text-ink-soft">{customer ?? email ?? "Customer"} · {formatDate(order.createdAt)}</p>
                  <p className="mt-1 text-[11px] text-ink/55">{(recentItemSummaries.get(order.id) ?? []).join(" · ")}</p>
                </div>
                <span className={`status-pill ${STATUS_STYLES[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <p className="text-sm font-semibold text-ink">{formatPKR(order.total)}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* side column */}
        <div className="space-y-6">
          {/* status distribution */}
          <div className="card p-6">
            <h2 className="font-display text-2xl font-medium text-ink">Order pipeline</h2>
            <div className="mt-4 space-y-3">
              {byStatus.length === 0 && <p className="text-sm text-ink-soft">Awaiting first orders.</p>}
              {byStatus
                .sort((a, b) => b.count - a.count)
                .map((s) => (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs font-semibold text-ink-soft">
                      <span>{ORDER_STATUS_LABELS[s.status]}</span>
                      <span>{s.count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className="h-full rounded-full bg-burgundy transition-all duration-700"
                        style={{ width: `${(s.count / maxStatus) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* quick counts */}
          <div className="card p-6">
            <h2 className="font-display text-2xl font-medium text-ink">Studio stats</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {(
                [
                  [Package, `${productStats?.active ?? 0} live / ${productStats?.count ?? 0} total dresses`],
                  [ShoppingBag, `${customerStats?.count ?? 0} registered accounts`],
                  [Star, `${reviewStats?.count ?? 0} published reviews`],
                  [MessageSquare, `${msgStats?.count ?? 0} contact messages`],
                ] as [React.ElementType, string][]
              ).map(([Icon, text], i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-ivory px-4 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-burgundy" />
                  <span className="text-ink-soft">{text}</span>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* stitching queue quick view */}
      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
            <Scissors className="h-5 w-5 text-burgundy" /> Stitching queue
          </h2>
          <Link href="/admin/orders" className="text-xs font-bold text-burgundy link-underline">Manage</Link>
        </div>
        {queueItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">
            Queue is clear — paid orders will appear here automatically.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs tracking-wider text-ink-soft uppercase">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Dress</th>
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Measurements</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.map(({ item, orderNumber, status }) => (
                  <tr key={item.id} className="border-b border-ink/5">
                    <td className="py-3 pr-4 font-bold text-ink">#{orderNumber}</td>
                    <td className="py-3 pr-4">{item.productName} × {item.quantity}</td>
                    <td className="py-3 pr-4">{item.size}</td>
                    <td className="py-3 pr-4 text-xs text-ink-soft">
                      {item.measurements && Object.values(item.measurements).some(Boolean)
                        ? Object.entries(item.measurements)
                            .filter(([k, v]) => v && k !== "notes")
                            .map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1, 3)} ${v}`)
                            .join(" · ")
                        : "—"}
                    </td>
                    <td className="py-3">
                      <span className={`status-pill ${STATUS_STYLES[status]}`}>{ORDER_STATUS_LABELS[status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
