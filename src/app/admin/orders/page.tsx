import Link from "next/link";
import { desc, sql, eq } from "drizzle-orm";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/business";
import { formatPKR, formatDateTime } from "@/lib/utils";
import { STATUS_STYLES } from "../../account/page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Orders" };

const FILTERS = ["all", "pending_payment", "confirmed", "stitching", "ready", "shipped", "completed", "cancelled"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = (FILTERS as readonly string[]).includes(status ?? "") ? status! : "all";

  const rows = await db
    .select({ order: orders, customer: users.name, email: users.email })
    .from(orders)
    .leftJoin(users, sql`${orders.userId} = ${users.id}`)
    .where(filter === "all" ? undefined : eq(orders.status, filter as (typeof orders.status.enumValues)[number]))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return (
    <div>
      <p className="eyebrow">Fulfilment</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-ink md:text-5xl">
        Orders <span className="display-italic text-burgundy">({rows.length})</span>
      </h1>

      {/* status filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={`chip ${filter === f ? "chip-active" : ""}`}
          >
            {f === "all" ? "All" : ORDER_STATUS_LABELS[f]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-cream">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-blush/60">
              <tr className="text-[11px] tracking-wider text-ink-soft uppercase">
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5">Advance</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-ink-soft">
                    No orders in this view yet.
                  </td>
                </tr>
              )}
              {rows.map(({ order, customer, email }) => (
                <tr key={order.id} className="border-t border-ink/8 transition-colors hover:bg-blush/40">
                  <td className="px-5 py-4">
                    <p className="font-bold text-ink">#{order.orderNumber}</p>
                    <p className="text-xs text-ink-soft">{formatDateTime(order.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{order.shippingName}</p>
                    <p className="text-xs text-ink-soft">{customer ?? email}</p>
                  </td>
                  <td className="px-5 py-4">{order.shippingCity}</td>
                  <td className="px-5 py-4">
                    {order.advancePaid ? (
                      <span className="status-pill bg-emerald-100 text-emerald-800">Paid</span>
                    ) : (
                      <span className="status-pill bg-amber-100 text-amber-800">Pending</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold">{formatPKR(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className={`status-pill ${STATUS_STYLES[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-burgundy link-underline"
                    >
                      Open <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
