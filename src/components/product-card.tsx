"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ArrowUpRight } from "lucide-react";
import { formatPKR, ratingToStars } from "@/lib/utils";
import type { Product } from "@/db/schema";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const img = product.images[0] ?? "/images/hero.jpg";
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="img-zoom relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {product.compareAtPrice && (
            <span className="absolute top-3 left-3 rounded-full bg-burgundy px-3 py-1 text-[10px] font-bold tracking-wider text-cream uppercase">
              Save {formatPKR(product.compareAtPrice - product.price)}
            </span>
          )}
          <span className="absolute top-3 right-3 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-cream/90 text-ink opacity-0 backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>

          <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="block rounded-xl bg-cream/90 px-4 py-2.5 text-center text-[11px] font-bold tracking-[0.18em] text-ink uppercase backdrop-blur">
              Customize & Order
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-burgundy uppercase">
              {product.category} · {product.fabric}
            </p>
            <h3 className="mt-1 font-display text-xl leading-tight font-medium text-ink transition-colors group-hover:text-burgundy">
              {product.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              {ratingToStars(product.rating).toFixed(1)}
              <span className="text-ink/40">({product.reviewCount})</span>
            </div>
          </div>
          <div className="text-right">
            {product.compareAtPrice && (
              <p className="text-xs text-ink/40 line-through">{formatPKR(product.compareAtPrice)}</p>
            )}
            <p className="font-display text-lg font-semibold text-ink">{formatPKR(product.price)}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
