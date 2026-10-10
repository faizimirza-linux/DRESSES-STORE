import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { ProductView } from "@/components/product-view";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .limit(1);

  if (!product) notFound();

  const productReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), eq(reviews.approved, true)))
    .orderBy(desc(reviews.createdAt));

  const related = await db
    .select()
    .from(products)
    .where(and(eq(products.category, product.category), eq(products.active, true)))
    .limit(5);

  return (
    <ProductView
      product={product}
      reviews={productReviews}
      related={related.filter((r) => r.id !== product.id).slice(0, 4)}
    />
  );
}
