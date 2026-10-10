import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { BUSINESS } from "./business";

/**
 * AI support assistant ("Noor") for DRESSES.
 *
 * If OPENAI_API_KEY is present we stream a GPT answer grounded in the business
 * context below. Otherwise a curated rule-based knowledge base answers the most
 * common questions, so the widget always works out of the box.
 */

export const ASSISTANT_CONTEXT = `
You are "Noor", the friendly customer-support assistant for ${BUSINESS.name},
a home-based custom stitching / tailoring atelier run by a woman entrepreneur
in ${BUSINESS.address}.

Facts you must know and use:
- Business: custom-stitched women's dresses — bridal, formal, party wear, casual/lawn suits.
- Contact number: ${BUSINESS.phoneDisplay} (WhatsApp available).
- Address: ${BUSINESS.address}. Studio hours: ${BUSINESS.hours}.
- ADVANCE DEPOSIT POLICY (very important): every order requires a mandatory
  PKR ${BUSINESS.advanceAmount.toLocaleString()} advance payment before stitching starts.
  Until the advance is paid, the order stays in "Pending Payment" and is NOT
  sent to the stitching queue. Once paid, status becomes "Order Confirmed / In Stitching".
- The remaining balance is collected on delivery (Cash on Delivery) nationwide.
- Payment methods: JazzCash mobile wallet, debit/credit card (Stripe/PayFast secure checkout).
- Turnaround: standard orders ${BUSINESS.turnaround}; bridal ${BUSINESS.bridalTurnaround}.
- Delivery: ${BUSINESS.courierNote}
- Order tracking: customers sign in and open Account → Orders to see live status
  (Pending Payment → Confirmed → In Stitching → Ready → Shipped → Delivered).
- Sizing: customers can pick a standard size (XS–XXL) or choose "Custom" and
  enter measurements in inches: bust, waist, hips, shoulder, sleeve length,
  kameez/shirt length, trouser length. Offer the size guide:
  ${BUSINESS.sizeGuide.map((s) => `${s.size}: bust ${s.bust}, waist ${s.waist}, hips ${s.hips}, shoulder ${s.shoulder}`).join(" | ")}
- Exchange policy: custom-measured dresses are exchanged only for stitching faults;
  report within 3 days with photos on WhatsApp.

Style: warm, concise (2–4 sentences unless a list is clearly better), use PKR
prices, gently guide users to products, checkout or WhatsApp when relevant.
Never invent discount codes or policies not listed above.
`;

/* ------------------------- rule-based fallback KB ------------------------- */

type Rule = { match: RegExp; reply: string };

const RULES: Rule[] = [
  {
    match: /advance|deposit|1000|1,?000|security/i,
    reply: `Every DRESSES order is confirmed with a mandatory PKR ${BUSINESS.advanceAmount.toLocaleString()} advance payment — payable by JazzCash or debit/credit card at checkout. Your order shows "Pending Payment" until the advance clears; the moment it does, it moves to "Order Confirmed / In Stitching". The remaining balance is collected on delivery (COD).`,
  },
  {
    match: /track|status|where.*order|order.*where/i,
    reply: `You can track your order live: sign in, open Account → Orders, and tap your order. You'll see each stage — Pending Payment, Order Confirmed / In Stitching, Ready to Dispatch, Shipped and Delivered.`,
  },
  {
    match: /how long|turnaround|deliver|shipping|courier|days/i,
    reply: `Standard orders take ${BUSINESS.turnaround} after your advance payment; bridal wear takes ${BUSINESS.bridalTurnaround}. We ship nationwide via TCS / Leopards and the remaining balance is collected on delivery.`,
  },
  {
    match: /size|measure|bust|waist|hip|fit/i,
    reply: `You have two options: pick a standard size (XS–XXL) or choose "Custom" on any product and enter your measurements in inches — bust, waist, hips, shoulder, sleeves, kameez length and trouser length. Size guide: S = bust 34"/waist 28", M = 36"/30", L = 38"/32". Measure without tightening the tape; if you're between sizes, go custom for a perfect fit.`,
  },
  {
    match: /jazzcash|card|payment|stripe|payfast|pay /i,
    reply: `We accept JazzCash mobile wallet and all major debit/credit cards through our secure checkout. Only the PKR ${BUSINESS.advanceAmount.toLocaleString()} advance is paid online — the rest is cash on delivery.`,
  },
  {
    match: /bridal|wedding|lehenga|shaadi|baraat/i,
    reply: `We specialise in made-to-measure bridal wear — lehengas, maxis and full trousseau sets, starting around PKR 54,500. Bridal pieces take ${BUSINESS.bridalTurnaround}, and the same PKR 1,000 advance confirms your slot. Browse the Bridal collection or message us on WhatsApp (${BUSINESS.phoneDisplay}) for a consultation.`,
  },
  {
    match: /return|exchange|refund|fault/i,
    reply: `Because every piece is cut to your measurements, exchanges are offered when there's a stitching fault — just send photos on WhatsApp (${BUSINESS.phoneDisplay}) within 3 days of delivery and we'll repair or remake it. If your advance is paid and we can't fulfil the order, it's refunded in full.`,
  },
  {
    match: /contact|phone|whatsapp|number|call/i,
    reply: `You can reach us at ${BUSINESS.phoneDisplay} (call or WhatsApp). Studio hours: ${BUSINESS.hours}. We're based in ${BUSINESS.address}.`,
  },
  {
    match: /where|location|address|narowal|shop/i,
    reply: `DRESSES is a home-based atelier in ${BUSINESS.address} — we don't have a walk-in shop, so every order is placed online and delivered to your door. You'll find a map on our Contact page.`,
  },
  {
    match: /custom|own design|my design|reference|photo stitch/i,
    reply: `Absolutely — send your reference photo on WhatsApp (${BUSINESS.phoneDisplay}) and we'll quote fabric + stitching. Or pick any design from the shop and choose "Custom" size to add your exact measurements and stitching notes.`,
  },
  {
    match: /price|cost|how much|range/i,
    reply: `Casual suits start around PKR 5,800, formals range PKR 10,000–17,000, and bridal wear starts near PKR 54,500. Every product page shows the full price — only PKR 1,000 is due online, the rest on delivery.`,
  },
  {
    match: /hi|hello|salam|aoa|hey/i,
    reply: `Assalam-o-Alaikum! Welcome to DRESSES — custom-stitched outfits made in Narowal. Ask me about sizing, the PKR 1,000 advance policy, delivery times, or tracking your order.`,
  },
];

const FALLBACK = `I'd love to help! You can ask me about sizing, the PKR ${BUSINESS.advanceAmount.toLocaleString()} advance deposit, delivery times, or tracking an order — or browse the shop. For anything else, WhatsApp us at ${BUSINESS.phoneDisplay}.`;

export function kbAnswer(message: string): string {
  for (const rule of RULES) if (rule.match.test(message)) return rule.reply;
  return FALLBACK;
}

/* ------------------------------- entry point ------------------------------ */

export async function answerAssistant(
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const last = history[history.length - 1]?.content ?? "";

  if (!process.env.OPENAI_API_KEY) {
    return kbAnswer(last);
  }

  try {
    const { text } = await generateText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      system: ASSISTANT_CONTEXT,
      messages: history.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      maxOutputTokens: 320,
      temperature: 0.4,
    });
    return text.trim() || kbAnswer(last);
  } catch (err) {
    console.error("[assistant] OpenAI failed, falling back to KB", err);
    return kbAnswer(last);
  }
}
