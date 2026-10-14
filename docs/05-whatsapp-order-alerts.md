# Automated WhatsApp order alerts

The checkout API can send the store owner a WhatsApp Cloud API alert after saving an order. The alert includes the order number, customer name and phone, dress names, sizes, quantities, measurements, stitching notes, delivery city/address, order total, and PKR 1,000 advance due. The order is still saved if WhatsApp is not configured or Meta rejects the alert. The customer-facing success dialog continues to ask the customer to send the payment screenshot to the existing WhatsApp number.

## Meta setup required

1. Create or use a Meta app with the WhatsApp use case and connect it to the store’s WhatsApp Business/Messaging account.
2. Register a Cloud API sender phone number. It must be different from the alert recipient number. The alert recipient defaults to `+923143372162`, the existing screenshot/contact number; override it if that is not the desired owner-alert destination.
3. Create a positional **Utility** template named `dresses_new_order_alert` in language `en_US`, then wait until Meta marks it **APPROVED**. Use this exact body so the site’s nine positional parameters match:

   ```text
   New DRESSES order {{1}}.
   Customer: {{2}} | phone: {{3}}.
   Items, sizes and measurements (1/2): {{4}}
   Items, sizes and measurements (2/2): {{5}}
   Delivery: {{6}}
   Customer note: {{7}}
   Total: PKR {{8}} | advance due: PKR {{9}}.
   Verify the advance before starting stitching.
   ```

   Provide example values for all nine placeholders when creating the template. The recipient must have opted in to receive these business notifications.
4. Add the server-only environment variables below to the Vercel production project. Never expose the access token through a `NEXT_PUBLIC_` variable or send it in chat.

| Variable | Value |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Meta system-user access token with WhatsApp messaging permissions |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone-number ID of the registered Cloud API sender |
| `WHATSAPP_CLOUD_API_SENDER_PHONE` | Sender number in international format, e.g. `+92...`; must differ from recipient |
| `WHATSAPP_ORDER_ALERT_TO` | Optional. Defaults to `+923143372162`; set the owner’s alert destination in international format |
| `WHATSAPP_ORDER_ALERT_TEMPLATE` | Optional. Defaults to `dresses_new_order_alert` |
| `WHATSAPP_ORDER_ALERT_LANGUAGE` | Optional. Defaults to `en_US` |
| `WHATSAPP_GRAPH_API_VERSION` | Optional. Defaults to `v26.0` |

A successful Messages API response confirms that Meta accepted the request, not that WhatsApp delivered it. Delivery/read receipts would require a separate webhook setup.
