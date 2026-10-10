import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ShopBrowser } from "@/components/shop-browser";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shop All Designs" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const all = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(desc(products.featured), desc(products.createdAt));

  return (
    <ShopBrowser
      products={all}
      initialCategory={params.category ?? "All"}
      initialQuery={params.q ?? ""}
    />
  );
}
