import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  productId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(8).max(600),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to leave a review." }, { status: 401 });
  }

  const rl = rateLimit(`reviews:${user.sub}`, 8, 60 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many reviews in a short time." }, { status: 429 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Review must be 8–600 characters with a 1–5 rating." }, { status: 400 });
  }

  const [product] = await db.select().from(products).where(eq(products.id, body.data.productId)).limit(1);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const [review] = await db
    .insert(reviews)
    .values({
      productId: product.id,
      userId: user.sub,
      authorName: user.name,
      rating: body.data.rating,
      text: body.data.text,
      approved: true,
    })
    .returning();

  await db.execute(sql`
    UPDATE products SET
      review_count = (SELECT count(*) FROM reviews WHERE product_id = ${product.id} AND approved),
      rating = COALESCE((SELECT round(avg(rating) * 10) FROM reviews WHERE product_id = ${product.id} AND approved), 50)
    WHERE id = ${product.id}
  `);

  return NextResponse.json({ ok: true, review });
}
