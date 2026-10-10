import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-5 pt-32 text-center">
      <p className="font-display text-[120px] leading-none font-medium text-burgundy/15">404</p>
      <h1 className="font-display text-4xl font-medium text-ink md:text-5xl">
        This page slipped <span className="display-italic text-burgundy">off the hanger</span>
      </h1>
      <p className="mt-4 text-sm text-ink-soft">
        The link may have moved or the design may have been retired. The collection, however, is very much intact.
      </p>
      <Link href="/shop" className="btn-primary mt-8">
        <ArrowLeft className="h-4 w-4" /> Back to the Collection
      </Link>
    </div>
  );
}
