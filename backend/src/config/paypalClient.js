// src/config/paypalClient.js
import fetch from "node-fetch";

const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_BASE =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.warn("⚠️ PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set in .env");
}

async function getAccessToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal getAccessToken failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ✅ สร้าง PayPal Order
export async function createPaypalOrder({ amount, currency = "THB", customId, description }) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2), // "11.00"
          },
          custom_id: customId,      // 👉 เก็บ orderId ของเรา
          description: description || "H2H Order",
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${text}`);
  }

  return res.json(); // จะได้ { id, links, ... }
}

// ✅ verify webhook signature
export async function verifyPaypalWebhookSignature(headers, body) {
  const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn("⚠️ PAYPAL_WEBHOOK_ID not set, skipping verification");
    return true;
  }

  const accessToken = await getAccessToken();

  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: body,
  };

  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("verifyWebhookSignature error:", res.status, text);
    return false;
  }

  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
