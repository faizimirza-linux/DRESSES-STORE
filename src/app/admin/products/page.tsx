import Link from "next/link";
import { desc } from "drizzle-orm";
import { PlusCircle, Star, Pencil } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { formatPKR, ratingToStars } from "@/lib/utils";
import { ProductRowControls } from "@/components/admin/product-row-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Dresses" };

export default async function AdminProductsPage() {
  const all = await db.select().from(products).orderBy(desc(products.createdAt));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-2 font-display text-4xl font-medium text-ink md:text-5xl">
            Dresses <span className="display-italic text-burgundy">({all.length})</span>
          </h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary px-6 py-3 text-xs">
          <PlusCircle className="h-4 w-4" /> Add Dress
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-cream">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-blush/60">
              <tr className="text-[11px] tracking-wider text-ink-soft uppercase">
                <th className="px-5 py-3.5">Dress</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Rating</th>
                <th className="px-5 py-3.5">Visibility</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {all.map((p) => (
                <tr key={p.id} className="border-t border-ink/8 align-middle transition-colors hover:bg-blush/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.images[0] ?? "/images/hero.jpg"} alt="" className="h-14 w-11 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-ink">{p.name}</p>
                        <p className="text-xs text-ink-soft">
                          {p.fabric} {p.featured && <span className="ml-1 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">FEATURED</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{p.category}</td>
                  <td className="px-5 py-4 font-semibold">{formatPKR(p.price)}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-xs font-semibold">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                      {ratingToStars(p.rating).toFixed(1)} ({p.reviewCount})
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <ProductRowControls productId={p.id} active={p.active} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold text-ink transition-colors hover:border-burgundy hover:text-burgundy"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </div>
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
