/**
 * Single source of truth for DRESSES business details.
 * Used across UI, chatbot context, payment logic and docs.
 */
export const BUSINESS = {
  name: "DRESSES",
  tagline: "Hand-stitched in Narowal, made for you",
  description:
    "DRESSES is a home-based custom tailoring atelier in Narowal, Pakistan. Every outfit is cut and stitched to your exact measurements — bridal wear, formals, party wear and everyday suits.",
  phoneDisplay: "0314 3372162",
  phoneRaw: "03143372162",
  phoneIntl: "+923143372162",
  whatsapp: "https://wa.me/923143372162",
  email: "hello@dresses.pk",
  address: "Narowal, Punjab, Pakistan",
  city: "Narowal",
  mapEmbed:
    "https://www.google.com/maps?q=Narowal,+Punjab,+Pakistan&z=13&output=embed",
  hours: "Mon – Sat, 10:00 AM – 8:00 PM (PKT)",
  /** Mandatory advance deposit, charged before stitching begins. */
  advanceAmount: 1000,
  currency: "PKR",
  deliveryFee: 250,
  turnaround: "7–10 working days",
  bridalTurnaround: "3–4 weeks",
  courierNote:
    "Nationwide delivery via TCS / Leopards. Remaining balance is collected on delivery (COD).",
  policies: [
    "Every order is confirmed with a mandatory PKR 1,000 advance payment.",
    "Stitching begins only after the advance payment is received.",
    "The remaining balance is collected on delivery (COD) or via a final payment link.",
    "Standard orders ship in 7–10 working days; bridal wear takes 3–4 weeks.",
    "Custom-measured dresses are exchanged only in case of a stitching fault.",
  ],
  sizeGuide: [
    { size: "XS", bust: "32", waist: "26", hips: "34", shoulder: "13.5" },
    { size: "S", bust: "34", waist: "28", hips: "36", shoulder: "14" },
    { size: "M", bust: "36", waist: "30", hips: "38", shoulder: "14.5" },
    { size: "L", bust: "38", waist: "32", hips: "40", shoulder: "15" },
    { size: "XL", bust: "40", waist: "34", hips: "42", shoulder: "15.5" },
    { size: "XXL", bust: "42", waist: "36", hips: "44", shoulder: "16" },
  ],
  measurementFields: [
    { key: "bust", label: "Bust / Chest", unit: "in", hint: "Around the fullest part" },
    { key: "waist", label: "Waist", unit: "in", hint: "Natural waistline" },
    { key: "hips", label: "Hips", unit: "in", hint: "Around the widest part" },
    { key: "shoulder", label: "Shoulder", unit: "in", hint: "Seam to seam" },
    { key: "sleeves", label: "Sleeve length", unit: "in", hint: "Shoulder to wrist" },
    { key: "length", label: "Shirt / Kameez length", unit: "in", hint: "Shoulder to hem" },
    { key: "trouser", label: "Trouser length", unit: "in", hint: "Waist to ankle" },
  ],
  categories: ["Formal", "Bridal", "Party", "Casual"],
  orderStatusFlow: [
    "pending_payment",
    "confirmed",
    "stitching",
    "ready",
    "shipped",
    "completed",
  ] as const,
} as const;

export type OrderStatus = (typeof BUSINESS.orderStatusFlow)[number] | "cancelled";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Order Confirmed / In Stitching Queue",
  stitching: "In Stitching",
  ready: "Ready to Dispatch",
  shipped: "Shipped",
  completed: "Delivered",
  cancelled: "Cancelled",
};
