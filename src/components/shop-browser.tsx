"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/db/schema";
import { ProductCard } from "./product-card";
import { BUSINESS } from "@/lib/business";

const COLORS = ["Red", "Maroon", "Black", "White", "Gold", "Blue", "Pink", "Brown"];
const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "new", label: "Newest" },
  { key: "low", label: "Price: Low → High" },
  { key: "high", label: "Price: High → Low" },
] as const;

export function ShopBrowser({
  products,
  initialCategory,
  initialQuery,
}: {
  products: Product[];
  initialCategory: string;
  initialQuery: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [color, setColor] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = ["All", ...BUSINESS.categories];

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (color) list = list.filter((p) => p.colors.includes(color));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case "low":
        list.sort((a, b) => a.price - b.price);
        break;
      case "high":
        list.sort((a, b) => b.price - a.price);
        break;
      case "new":
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [products, category, color, query, sort]);

  const filterControls = (
    <>
      <div>
        <p className="label">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`chip ${category === c ? "chip-active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Colour</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(color === c ? null : c)}
              className={`chip ${color === c ? "chip-active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Sort</p>
        <div className="flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`chip ${sort === s.key ? "chip-active" : ""}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pt-40 pb-24 md:px-8 md:pt-44">
      {/* heading */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The Catalogue</p>
          <h1 className="mt-3 font-display text-5xl font-medium text-ink md:text-6xl">
            Shop <span className="display-italic text-burgundy">all designs</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-ink-soft">
            {filtered.length} of {products.length} designs · every piece is stitched to
            order in Narowal with a {`PKR ${BUSINESS.advanceAmount.toLocaleString()}`} advance.
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lehenga, velvet, anarkali…"
              className="field pl-11"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-ink/40 hover:text-burgundy"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="btn-ghost px-5 py-3 lg:hidden"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* desktop filters */}
      <div className="mt-8 hidden gap-8 rounded-2xl border border-ink/10 bg-cream/60 p-6 lg:grid lg:grid-cols-3">
        {filterControls}
      </div>

      {/* mobile filters */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 space-y-6 overflow-hidden rounded-2xl border border-ink/10 bg-cream/60 p-6 lg:hidden"
          >
            {filterControls}
          </motion.div>
        )}
      </AnimatePresence>

      {/* grid */}
      {filtered.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="font-display text-3xl text-ink/60">Nothing matches that — yet.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Try clearing a filter, or ask the assistant (bottom-right) to find your style.
          </p>
        </div>
      ) : (
        <motion.div layout className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
