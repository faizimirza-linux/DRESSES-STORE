import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Dress" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();

  return (
    <div>
      <p className="eyebrow">Catalogue</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-ink md:text-5xl">
        Edit <span className="display-italic text-burgundy">{product.name}</span>
      </h1>
      <div className="mt-8">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
