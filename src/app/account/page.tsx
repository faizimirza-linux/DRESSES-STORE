import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, Package, User, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { BUSINESS, ORDER_STATUS_LABELS } from "@/lib/business";
import { formatPKR, formatDate } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account" };

export const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  stitching: "bg-sky-100 text-sky-800",
  ready: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-rose-100 text-rose-700",
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.sub))
    .orderBy(desc(orders.createdAt));

  const active = myOrders.filter((o) => !["completed", "cancelled"].includes(o.status));

  return (
    <div className="mx-auto max-w-7xl px-5 pt-40 pb-24 md:px-8 md:pt-44">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">My Account</p>
          <h1 className="mt-3 font-display text-5xl font-medium text-ink md:text-6xl">
            Khush aamdeed, <span className="display-italic text-burgundy">{user.name.split(" ")[0]}</span>
          </h1>
        </div>
        <LogoutButton className="btn-ghost px-5 py-2.5 text-xs" />
      </div>

      {/* profile strip */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="card flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-burgundy/10">
            <User className="h-5 w-5 text-burgundy" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">{user.name}</p>
            <p className="text-xs text-ink-soft">{user.email}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-burgundy/10">
            <Package className="h-5 w-5 text-burgundy" />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold text-ink">{active.length}</p>
            <p className="text-xs text-ink-soft">active order{active.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/15">
            <ShieldCheck className="h-5 w-5 text-gold" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">
              {user.role === "admin" ? "Administrator" : "Customer"}
            </p>
            {user.role === "admin" ? (
              <Link href="/admin" className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold text-burgundy link-underline">
                Open admin dashboard <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <p className="text-xs text-ink-soft">Advance-secured ordering enabled</p>
            )}
          </div>
        </div>
      </div>

      {/* orders */}
      <h2 className="mt-14 font-display text-3xl font-medium text-ink">
        Order <span className="display-italic text-burgundy">history</span>
      </h2>

      {myOrders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/20 p-14 text-center">
          <p className="font-display text-2xl text-ink/60">No orders yet.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Start one with just {formatPKR(BUSINESS.advanceAmount)} — the rest on delivery.
          </p>
          <Link href="/shop" className="btn-primary mt-6">Browse Designs</Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-cream">
          {myOrders.map((o, i) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className={`group flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-blush/50 ${
                i > 0 ? "border-t border-ink/8" : ""
              }`}
            >
              <div>
                <p className="font-bold text-ink transition-colors group-hover:text-burgundy">
                  #{o.orderNumber}
                </p>
                <p className="text-xs text-ink-soft">{formatDate(o.createdAt)}</p>
              </div>
              <span className={`status-pill ${STATUS_STYLES[o.status]}`}>
                {ORDER_STATUS_LABELS[o.status]}
              </span>
              <div className="text-right">
                <p className="font-display text-lg font-semibold text-ink">{formatPKR(o.total)}</p>
                <p className="text-xs text-ink-soft">
                  {o.advancePaid ? `advance paid · ${formatPKR(o.balanceDue)} COD` : "advance pending"}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-ink/30 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-burgundy" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
