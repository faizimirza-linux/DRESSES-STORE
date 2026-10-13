"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { confirmManualAdvance } from "@/app/admin/actions";

export function ManualAdvanceVerification({
  orderId,
  advancePaid,
}: {
  orderId: string;
  advancePaid: boolean;
}) {
  const [wallet, setWallet] = useState<"jazzcash" | "easypaisa">("jazzcash");
  const [txnRef, setTxnRef] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setMessage(null);
    setError(null);
    start(async () => {
      const result = await confirmManualAdvance(orderId, { wallet, txnRef });
      if (result.ok) {
        setMessage("Advance verified. The order is now confirmed and in the stitching queue.");
        setTxnRef("");
      } else {
        setError(result.error ?? "Could not confirm the advance.");
      }
    });
  }

  return (
    <div className="card p-6">
      <p className="label">Manual advance verification</p>
      {advancePaid ? (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800">
          <Check className="mr-1 inline h-3.5 w-3.5" /> Advance received and recorded.
        </p>
      ) : (
        <>
          <p className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-amber-800">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Check the customer&apos;s WhatsApp payment screenshot and confirm the transfer in your wallet before continuing. This starts the stitching queue.
          </p>
          <div className="mt-4 space-y-3">
            <select
              value={wallet}
              onChange={(event) => setWallet(event.target.value as "jazzcash" | "easypaisa")}
              className="field"
              aria-label="Wallet used for the advance"
            >
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
            </select>
            <input
              value={txnRef}
              onChange={(event) => setTxnRef(event.target.value)}
              maxLength={120}
              className="field"
              placeholder="Transaction reference (optional)"
            />
            <button type="button" onClick={confirm} disabled={pending} className="btn-primary w-full">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirm PKR 1,000 received
            </button>
          </div>
        </>
      )}
      {message && <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-xs font-semibold text-burgundy">{error}</p>}
    </div>
  );
}
