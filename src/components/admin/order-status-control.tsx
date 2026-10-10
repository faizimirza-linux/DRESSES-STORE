"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, TriangleAlert } from "lucide-react";
import { setOrderStatus } from "@/app/admin/actions";
import { ORDER_STATUS_LABELS } from "@/lib/business";

const ALL_STATUSES = [
  "pending_payment",
  "confirmed",
  "stitching",
  "ready",
  "shipped",
  "completed",
  "cancelled",
] as const;

export function OrderStatusControl({
  orderId,
  current,
  advancePaid,
}: {
  orderId: string;
  current: (typeof ALL_STATUSES)[number] | string;
  advancePaid: boolean;
}) {
  const [status, setStatus] = useState(current);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMessage(null);
    setError(null);
    start(async () => {
      const res = await setOrderStatus(orderId, status as (typeof ALL_STATUSES)[number], note);
      if (res.ok) {
        setMessage("Status updated — customer timeline refreshed.");
        setNote("");
      } else {
        setError(res.error ?? "Could not update status");
        setStatus(current);
      }
    });
  }

  return (
    <div className="card p-6">
      <p className="label">Update order status</p>
      {!advancePaid && (
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] font-semibold text-amber-800">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Advance not paid — this order is locked out of the stitching queue until the
          PKR 1,000 advance clears.
        </p>
      )}
      <div className="space-y-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field">
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="field"
          placeholder="Optional note (e.g. courier tracking #)"
        />
        <button onClick={save} disabled={pending || status === current} className="btn-primary w-full">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Status
        </button>
        {message && <p className="text-xs font-semibold text-emerald-700">{message}</p>}
        {error && <p className="text-xs font-semibold text-burgundy">{error}</p>}
      </div>
    </div>
  );
}
