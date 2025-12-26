// frontend/src/pages/orders/PayButton.jsx
import { useState } from "react";
import Button from "../../components/ui/Button";
import { api } from "../../lib/api";

/**
 * PayButton รองรับทั้ง mock/offline + PayPal
 *
 * Props:
 * - orderId (จำเป็น)
 * - amount (number)
 * - method: "cash" | "transfer" | "promptpay" | "card" | "paypal"
 * - onPaid(updatedOrder?) -> callback หลัง mock payment สำเร็จ
 * - children -> label ปุ่ม
 */
export default function PayButton({
  orderId,
  amount,
  method = "cash",
  onPaid,
  children,
}) {
  const [busy, setBusy] = useState(false);

  const onPay = async () => {
    if (!orderId) {
      alert("Missing orderId");
      return;
    }

    setBusy(true);
    try {
      // 🔹 PayPal flow
      if (method === "paypal") {
        console.log("🔥 create paypal order...", { orderId, amount });

        // backend คาดหวัง { orderId, amount, currency?, note? }
        const res = await api.post("/pay/paypal/create", {
          orderId,
          amount,
          currency: "THB",
          note: "H2H Thailand order",
        });

        console.log("✅ paypal create ok (raw):", res);

        // backend ตอบ { ok, orderId, paypalOrderId, approveUrl }
        const approveUrl =
          res?.approveUrl ||
          res?.approvalUrl ||
          res?.approvalLink ||
          (res?.links || []).find((l) => l.rel === "approve")?.href;

        if (!approveUrl) {
          console.error("No approveUrl from PayPal:", res);
          alert(
            "ไม่พบลิงก์ชำระเงินของ PayPal\n" +
              "ลองดูรายละเอียดเพิ่มใน Console (DevTools)"
          );
          return;
        }

        // redirect ไปหน้า PayPal sandbox
        window.location.href = approveUrl;
        return;
      }

      // 🔹 Mock flow (cash / transfer / promptpay / card)
      const payload = { orderId, method };
      if (typeof amount === "number") {
        payload.amount = amount;
      }

      const res = await api.post("/pay/mock", payload);
      console.log("mock pay result:", res);

      if (res?.order && typeof onPaid === "function") {
        onPaid(res.order);
      } else if (typeof onPaid === "function") {
        onPaid(res);
      }

      alert("✅ บันทึกการชำระเงิน (โหมดทดลอง) เรียบร้อย");
    } catch (err) {
      console.error("pay error:", err);

      // เผื่อ api.js แนบ response แบบ axios-style มาให้
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status && data) {
        alert(
          `ชำระเงินไม่สำเร็จ (${status})\n` +
            (data.message || JSON.stringify(data, null, 2))
        );
      } else {
        alert(err?.message || "ชำระเงินไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={onPay}
      disabled={busy}
      className="min-w-[180px]"
    >
      {busy ? "กำลังดำเนินการ..." : children || "ชำระเงิน"}
    </Button>
  );
}
