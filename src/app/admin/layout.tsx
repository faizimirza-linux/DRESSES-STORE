import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  PlusCircle,
  Store,
  Scissors,
} from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { BUSINESS } from "@/lib/business";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Dresses", icon: Package },
  { href: "/admin/products/new", label: "Add Dress", icon: PlusCircle },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/account");

  return (
    <div className="mx-auto max-w-7xl px-5 pt-36 pb-20 md:px-8 lg:pt-40">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        {/* sidebar */}
        <aside className="h-fit rounded-3xl bg-ink p-5 text-cream lg:sticky lg:top-36">
          <div className="flex items-center gap-3 border-b border-cream/10 px-2 pb-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-ink">
              <Scissors className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold tracking-wider">{BUSINESS.name}</p>
              <p className="text-[10px] font-bold tracking-[0.24em] text-gold uppercase">Owner Studio</p>
            </div>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-cream/70 transition-all hover:bg-cream/10 hover:text-gold-light"
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            <Link
              href="/shop"
              className="mt-0 flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-cream/40 transition-all hover:bg-cream/10 hover:text-cream lg:mt-4 lg:border-t lg:border-cream/10 lg:pt-5"
            >
              <Store className="h-4 w-4" /> View Store
            </Link>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
