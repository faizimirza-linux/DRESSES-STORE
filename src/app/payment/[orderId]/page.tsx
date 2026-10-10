import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { PaymentFlow } from "@/components/payment-flow";

export const dynamic = "force-dynamic";

export const metadata = { title: "Advance Payment" };

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { orderId } = await params;
  const { session } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/payment/${orderId}`);

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || (order.userId !== user.sub && user.role !== "admin")) notFound();

  const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);

  return (
    <PaymentFlow
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        advanceAmount: order.advanceAmount,
        balanceDue: order.balanceDue,
        status: order.status,
        advancePaid: order.advancePaid,
        provider: payment?.provider ?? order.paymentProvider ?? "sandbox",
        txnRef: payment?.txnRef ?? null,
      }}
      stripeReturn={session ?? null}
    />
  );
}
