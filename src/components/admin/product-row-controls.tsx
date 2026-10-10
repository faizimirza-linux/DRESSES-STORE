"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toggleProductActive, deleteProduct } from "@/app/admin/actions";

export function ProductRowControls({ productId, active }: { productId: string; active: boolean }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={pending}
        onClick={() => start(async () => { await toggleProductActive(productId, !active); })}
        className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-emerald-500" : "bg-ink/20"}`}
        title={active ? "Live in shop" : "Hidden from shop"}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${active ? "left-5.5" : "left-0.5"}`}
        />
      </button>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/40" />}
      <button
        disabled={pending}
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            setTimeout(() => setConfirming(false), 3000);
            return;
          }
          start(async () => { await deleteProduct(productId); });
        }}
        title={confirming ? "Click again to confirm delete" : "Delete"}
        className={`rounded-full p-1.5 transition-colors ${confirming ? "bg-burgundy text-cream" : "text-ink/40 hover:bg-burgundy/10 hover:text-burgundy"}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
