import "server-only";

import { BUSINESS } from "@/lib/business";
import type { Measurements } from "@/db/schema";

type AlertOrderItem = {
  productName: string;
  unitPrice: number;
  quantity: number;
  size: string;
  measurements?: Measurements | null;
  stitchingNotes?: string | null;
};

export type NewOrderWhatsAppAlert = {
  orderId: string;
  orderNumber: string;
  total: number;
  advanceAmount: number;
  shipping: {
    name: string;
    phone: string;
    city: string;
    address: string;
    note?: string | null;
  };
  items: AlertOrderItem[];
};

type AlertResult =
  | { status: "accepted"; messageId?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

const TEMPLATE_PARAM_LIMIT = 900;

function normalizePakistaniOrInternationalNumber(value: string): string | null {
  let normalized = value.trim().replace(/[\s().-]/g, "");
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`;
  if (normalized.startsWith("0")) normalized = `+92${normalized.slice(1)}`;
  else if (normalized.startsWith("92")) normalized = `+${normalized}`;
  else if (!normalized.startsWith("+")) normalized = `+${normalized}`;

  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}

function limitTemplateText(value: string, limit = TEMPLATE_PARAM_LIMIT): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "—";
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 14).trimEnd()}… [truncated]`;
}

function splitItemSummary(items: AlertOrderItem[]): [string, string] {
  const lines = items.map((item, index) => {
    const measurements = item.measurements
      ? Object.entries(item.measurements)
          .filter(([, value]) => Boolean(value))
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
      : "";
    const notes = item.stitchingNotes?.trim();
    return [
      `${index + 1}. ${item.productName} — size ${item.size} × ${item.quantity}; PKR ${item.unitPrice} each`,
      measurements ? `Measurements: ${measurements}` : "",
      notes ? `Stitching note: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("; ");
  });

  const parts = ["", ""];
  let part = 0;
  for (const line of lines) {
    const next = parts[part] ? `${parts[part]} | ${line}` : line;
    if (next.length <= TEMPLATE_PARAM_LIMIT) {
      parts[part] = next;
      continue;
    }

    if (part === 0) {
      part = 1;
      parts[part] = line.length <= TEMPLATE_PARAM_LIMIT
        ? line
        : limitTemplateText(line);
    } else {
      const available = Math.max(TEMPLATE_PARAM_LIMIT - parts[part].length - 18, 0);
      if (available > 0) parts[part] = `${parts[part]} | ${line.slice(0, available)}… [more omitted]`;
      break;
    }
  }

  return [parts[0] || "—", parts[1] || "—"];
}

/**
 * Sends a new-order alert using an approved WhatsApp Utility template.
 * This function is server-only: all credentials are read from server env vars.
 * Missing configuration skips alerts without interrupting checkout.
 */
export async function sendNewOrderWhatsAppAlert(order: NewOrderWhatsAppAlert): Promise<AlertResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const senderPhoneValue = process.env.WHATSAPP_CLOUD_API_SENDER_PHONE?.trim();
  const recipientValue = process.env.WHATSAPP_ORDER_ALERT_TO?.trim() || BUSINESS.phoneIntl;
  const templateName = process.env.WHATSAPP_ORDER_ALERT_TEMPLATE?.trim() || "dresses_new_order_alert";
  const language = process.env.WHATSAPP_ORDER_ALERT_LANGUAGE?.trim() || "en_US";
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";

  if (!accessToken || !phoneNumberId || !senderPhoneValue) {
    return { status: "skipped", reason: "missing_cloud_api_credentials_or_sender_number" };
  }

  const recipient = normalizePakistaniOrInternationalNumber(recipientValue);
  const senderPhone = normalizePakistaniOrInternationalNumber(senderPhoneValue);
  if (!recipient || !senderPhone) {
    return { status: "skipped", reason: "invalid_sender_or_recipient_phone" };
  }
  if (recipient === senderPhone) {
    return { status: "skipped", reason: "recipient_must_differ_from_cloud_api_sender" };
  }
  if (!/^v\d+\.\d+$/.test(apiVersion) || !/^[a-z0-9_]{1,512}$/.test(templateName)) {
    return { status: "skipped", reason: "invalid_graph_api_version_or_template_name" };
  }

  const [itemPartOne, itemPartTwo] = splitItemSummary(order.items);
  const delivery = limitTemplateText(
    `${order.shipping.city}, ${order.shipping.address}`,
  );
  const customerNote = limitTemplateText(order.shipping.note || "No additional customer note");
  const parameters = [
    order.orderNumber,
    order.shipping.name,
    normalizePakistaniOrInternationalNumber(order.shipping.phone) || order.shipping.phone,
    itemPartOne,
    itemPartTwo,
    delivery,
    customerNote,
    order.total.toLocaleString("en-PK"),
    order.advanceAmount.toLocaleString("en-PK"),
  ];

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: parameters.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      },
    );

    const result = (await response.json().catch(() => null)) as
      | { messages?: Array<{ id?: string }> ; error?: { code?: number } }
      | null;

    if (!response.ok) {
      const errorCode = typeof result?.error?.code === "number" ? `_${result.error.code}` : "";
      return { status: "failed", reason: `meta_http_${response.status}${errorCode}` };
    }

    return { status: "accepted", messageId: result?.messages?.[0]?.id };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error && error.name === "TimeoutError" ? "meta_request_timeout" : "meta_network_error",
    };
  }
}
