import TokenBalance from "../models/TokenBalance.js";
import TokenLedger from "../models/TokenLedger.js";

/**
 * คำนวณ reward token จากยอดเงิน
 */
function calcRewardTokens(amountTHB) {
  const rate = Number(process.env.TOKEN_REWARD_RATE || 0);
  const min = Number(process.env.TOKEN_REWARD_MIN || 0);

  const raw = amountTHB * rate;
  const tokens = Math.floor(raw); // ปัดลง
  return Math.max(min, tokens);
}

/**
 * แจก token ให้ buyer จาก order (กันซ้ำด้วย idempotencyKey)
 */
export async function awardTokensForPaidOrder(order, { paypalEventId } = {}) {
  const amount = Number(order.amount || 0);
  if (!amount || amount <= 0) return { ok: false, reason: "amount_invalid" };

  const userId = order.buyerId;
  if (!userId) return { ok: false, reason: "missing_buyerId" };

  // idempotencyKey: 1 order แจกครั้งเดียว
  const idempotencyKey = `reward:order:${order._id.toString()}`;

  // ถ้ามี ledger อยู่แล้ว แปลว่าเคยแจกแล้ว
  const exists = await TokenLedger.findOne({ idempotencyKey });
  if (exists) {
    return { ok: true, skipped: true, message: "already_rewarded", ledgerId: exists._id };
  }

  const reward = calcRewardTokens(amount);
  const symbol = process.env.TOKEN_SYMBOL || "BROC";

  // สร้าง ledger (unique idempotencyKey กันซ้ำ)
  const ledger = await TokenLedger.create({
    userId,
    orderId: order._id,
    amount: reward,
    symbol,
    type: "reward",
    reason: "purchase_reward",
    idempotencyKey,
    meta: {
      paypalEventId,
      orderNumber: order.orderNumber,
      amountTHB: amount,
    },
  });

  // อัปเดต balance
  await TokenBalance.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: { userId, symbol, balance: 0 },
      $inc: { balance: reward },
      $set: { updatedAt: new Date() },
    },
    { upsert: true, new: true }
  );

  return { ok: true, reward, ledgerId: ledger._id };
}
