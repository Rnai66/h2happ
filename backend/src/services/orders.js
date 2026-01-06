// backend/src/services/orders.js
import db from "../config/db.js"; // mock: เข้าถึง collection/tables

export async function getOrderById(orderId) {
  return db.orders.findOne({ id: orderId });  // ปรับตามจริง
}

export async function markOrderPaid({ orderId, paymentId, provider, paidAt }) {
  return db.orders.updateOne(
    { id: orderId },
    {
      $set: {
        status: "PAID",
        "payment.provider": provider,
        "payment.paymentId": paymentId,
        "payment.paidAt": paidAt,
      },
      $setOnInsert: { receipts: [] }
    }
  );
}
