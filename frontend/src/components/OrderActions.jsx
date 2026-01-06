import { api } from "../api";
export default function OrderActions({ tokenBuyer, tokenSeller, order, role, onUpdated }) {
  if (!order) return null;

  const actions = [];
  if (order.status === "PAID_PENDING_VERIFY" && role === "seller") {
    actions.push({ label:"ยืนยันชำระเงิน", onClick: async () => {
      const res = await api.verify(tokenSeller, order._id); onUpdated?.(res);
    }});
  }
  if (["PAID_VERIFIED","FULFILLED"].includes(order.status) && role) {
    actions.push({ label:"ปิดงาน", onClick: async () => {
      const token = role === "buyer" ? tokenBuyer : tokenSeller;
      const res = await api.complete(token, order._id); onUpdated?.(res);
    }});
  }

  return (
    <div className="flex gap-2 mt-2">
      {actions.map((a,i)=>(
        <button key={i} className="px-4 py-2 rounded-2xl bg-amber-600 text-white"
                onClick={a.onClick}>{a.label}</button>
      ))}
    </div>
  );
}
