import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add Dress" };

export default function NewProductPage() {
  return (
    <div>
      <p className="eyebrow">Catalogue</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-ink md:text-5xl">
        Add a <span className="display-italic text-burgundy">new dress</span>
      </h1>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}
