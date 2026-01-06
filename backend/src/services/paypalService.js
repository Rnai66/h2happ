// backend/src/services/paypalService.js
import fetch from "node-fetch";

const PAYPAL_BASE =
  process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

async function getPaypalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret =
    process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    console.error("❌ [PayPal] ENV missing:", {
      PAYPAL_CLIENT_ID: clientId ? "(set)" : "(missing)",
      PAYPAL_SECRET: process.env.PAYPAL_SECRET ? "(set)" : "(missing)",
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET
        ? "(set)"
        : "(missing)",
    });
    throw new Error(
      "PayPal credentials not configured (CLIENT_ID/SECRET missing)"
    );
  }

  console.log(
    "🔑 [PayPal] Using clientId/secret length:",
    clientId.length,
    secret.length
  );
  console.log("🌐 [PayPal] BASE URL:", PAYPAL_BASE);

  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("❌ [PayPal] token res not ok:", res.status, text);
    throw new Error(`PayPal token error: ${res.status} ${text}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("❌ [PayPal] token JSON parse error:", e, text);
    throw new Error("PayPal token JSON parse error");
  }

  console.log("✅ [PayPal] token ok, scopes:", data.scope);
  return data.access_token;
}

export async function createPaypalOrder({ amount, currency, description }) {
  const token = await getPaypalAccessToken();

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount,
        },
        description,
      },
    ],
    application_context: {
      brand_name: "H2H Thailand",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: `${process.env.CLIENT_BASE_URL}/pay/success`,
      cancel_url: `${process.env.CLIENT_BASE_URL}/pay/cancel`,
    },
  };

  console.log("📤 [PayPal] create order payload:", payload);

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("❌ [PayPal] create order res not ok:", res.status, text);
    throw new Error(`PayPal create order error: ${res.status} ${text}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("❌ [PayPal] create order JSON parse error:", e, text);
    throw new Error("PayPal create order JSON parse error");
  }

  const approveLink = data.links?.find((l) => l.rel === "approve");
  if (!approveLink) {
    console.error("❌ [PayPal] no approve link in response:", data);
    throw new Error("No approve link from PayPal");
  }

  console.log("✅ [PayPal] order created:", {
    id: data.id,
    approveUrl: approveLink.href,
  });

  return {
    paypalOrderId: data.id,
    approveUrl: approveLink.href,
  };
}
export async function verifyPaypalWebhookSignature({ headers, body }) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    // ถ้ายังไม่ได้ตั้ง webhook id ให้ “ปิด verify” ชั่วคราว (dev)
    return { ok: false, skipped: true, reason: "missing_webhook_id" };
  }

  const token = await getPaypalAccessToken();

  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: webhookId,
    webhook_event: body,
  };

  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal verify signature error: ${res.status} ${text}`);
  }

  const data = JSON.parse(text);
  return { ok: true, verification_status: data.verification_status };
}
