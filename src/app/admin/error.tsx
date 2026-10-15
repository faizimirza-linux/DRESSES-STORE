"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page render error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-burgundy/15 bg-cream p-8 text-center shadow-card">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-burgundy/10 text-burgundy">
        <TriangleAlert className="h-6 w-6" />
      </span>
      <p className="eyebrow mt-5">Owner Studio</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">This page could not load</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Refresh and try again. When adding photos, use the compressed upload or library images; Vercel cannot accept a single publish request larger than about 4 MB.
      </p>
      {error.digest && <p className="mt-3 text-[11px] text-ink/45">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link href="/admin/products" className="btn-ghost">Back to dresses</Link>
      </div>
    </div>
  );
}
