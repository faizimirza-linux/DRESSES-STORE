import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { HomeSections } from "@/components/home-sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await db
    .select()
    .from(products)
    .where(eq(products.featured, true))
    .orderBy(desc(products.createdAt))
    .limit(8);

  const allReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.createdAt))
    .limit(12);

  return <HomeSections featured={featured} reviews={allReviews} />;
}
