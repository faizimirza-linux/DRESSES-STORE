"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, orderEvents, payments, products } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";

/* -------------------------------- products -------------------------------- */

const productSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(2).max(180),
  slug: z.string().max(180).optional(),
  description: z.string().min(10),
  fabric: z.string().min(2).max(120),
  category: z.enum(["Formal", "Bridal", "Party", "Casual"]),
  price: z.number().int().min(500),
  compareAtPrice: z.number().int().positive().nullable(),
  colors: z.array(z.string()).min(1),
  sizes: z.array(z.string()).min(1),
  images: z.array(z.string().min(1)).min(1),
  featured: z.boolean(),
  active: z.boolean(),
});

export async function saveProduct(input: z.infer<typeof productSchema>) {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] ? `${String(issue.path[0])}: ` : "";
    return { ok: false as const, error: `${field}${issue?.message ?? "Please check the product details."}` };
  }
  const data = parsed.data;
  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.name);

  const values = {
    name: data.name,
    slug,
    description: data.description,
    fabric: data.fabric,
    category: data.category,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    colors: data.colors,
    sizes: data.sizes,
    images: data.images,
    featured: data.featured,
    active: data.active,
    updatedAt: new Date(),
  };

  let id = data.id;
  try {
    if (id) {
      await db.update(products).set(values).where(eq(products.id, id));
    } else {
      const [row] = await db.insert(products).values(values).returning({ id: products.id });
      if (!row) return { ok: false as const, error: "The dress could not be saved. Please try again." };
      id = row.id;
    }
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "23505") {
      return { ok: false as const, error: "That URL slug is already in use. Choose a different slug or dress name." };
    }
    console.error("Product save failed", error);
    return { ok: false as const, error: "The dress could not be saved right now. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${slug}`);
  revalidatePath("/");
  return { ok: true, id, slug };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleProductActive(id: string, active: boolean) {
  await requireAdmin();
  await db.update(products).set({ active, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true };
}

/* --------------------------------- orders --------------------------------- */

const statusSchema = z.enum([
  "pending_payment",
  "confirmed",
  "stitching",
  "ready",
  "shipped",
  "completed",
  "cancelled",
]);

export async function setOrderStatus(
  orderId: string,
  status: z.infer<typeof statusSchema>,
  note?: string,
) {
  await requireAdmin();
  const parsed = statusSchema.parse(status);

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "Order not found" };

  // Advance-payment guard: an order can never leave pending_payment until paid
  // (except to cancelled) — the stitching queue is payment-gated.
  if (
    order.status === "pending_payment" &&
    !order.advancePaid &&
    parsed !== "pending_payment" &&
    parsed !== "cancelled"
  ) {
    return {
      ok: false,
      error: "Advance payment not received yet — this order cannot enter the stitching queue.",
    };
  }

  await db
    .update(orders)
    .set({ status: parsed, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await db.insert(orderEvents).values({
    orderId,
    status: parsed,
    note: note?.trim() || null,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin");
  return { ok: true };
}

const manualAdvanceSchema = z.object({
  wallet: z.enum(["jazzcash", "easypaisa"]),
  txnRef: z.string().trim().max(120).optional(),
});

/** Confirm a customer-submitted wallet receipt after the admin has checked it. */
export async function confirmManualAdvance(
  orderId: string,
  input: z.infer<typeof manualAdvanceSchema>,
) {
  await requireAdmin();
  const data = manualAdvanceSchema.parse(input);

  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return { ok: false as const, error: "Order not found." };
    if (order.advancePaid) return { ok: false as const, error: "This advance is already confirmed." };
    if (order.status !== "pending_payment") {
      return { ok: false as const, error: "Only an order awaiting payment can be confirmed." };
    }

    const now = new Date();
    const method = data.wallet === "easypaisa" ? "EasyPaisa" : "JazzCash";
    const reference = data.txnRef?.trim() || null;
    const paymentUpdate = await tx
      .update(payments)
      .set({
        status: "paid",
        paidAt: now,
        txnRef: reference,
        raw: { source: "admin_manual_verification", wallet: data.wallet } as never,
      })
      .where(eq(payments.orderId, orderId))
      .returning({ id: payments.id });

    if (paymentUpdate.length === 0) {
      await tx.insert(payments).values({
        orderId,
        provider: "jazzcash",
        amount: order.advanceAmount,
        status: "paid",
        paidAt: now,
        txnRef: reference,
        raw: { source: "admin_manual_verification", wallet: data.wallet },
      });
    }

    await tx
      .update(orders)
      .set({ status: "confirmed", advancePaid: true, paidAt: now, updatedAt: now })
      .where(eq(orders.id, orderId));
    await tx.insert(orderEvents).values({
      orderId,
      status: "confirmed",
      note: `PKR ${order.advanceAmount.toLocaleString()} advance verified manually via ${method}${reference ? ` (ref ${reference})` : ""}. Order confirmed and added to the stitching queue.`,
    });

    return { ok: true as const };
  });

  if (result.ok) {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath("/admin");
  }
  return result;
}
