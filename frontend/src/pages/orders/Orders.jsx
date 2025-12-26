import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";
import { api } from "../../lib/api";
import { getUser } from "../../lib/auth";

/* ===== helpers (เดิมทั้งหมด) ===== */
function formatDate(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString("th-TH");
  } catch {
    return String(dt);
  }
}
function normalizeOrders(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.orders)) return raw.orders;
  if (raw.data && Array.isArray(raw.data.orders)) return raw.data.orders;
  return [];
}
function getAmount(o) {
  if (!o) return 0;
  if (typeof o.amount === "number") return o.amount;
  if (typeof o.price === "number") return o.price;
  if (typeof o.total === "number") return o.total;
  return 0;
}
function getPaymentStatus(o) {
  if (!o) return "unpaid";
  return o.paymentStatus || o.payment_status || "unpaid";
}
function getBuyerIdFromOrder(o) {
  if (!o) return null;
  return (
    o.buyerId ||
    o.buyer_id ||
    o.buyerID ||
    (o.buyer && (o.buyer.id || o.buyer._id || o.buyer.userId)) ||
    o.userId ||
    (o.user && (o.user.id || o.user._id))
  );
}
function getSellerIdFromOrder(o) {
  if (!o) return null;
  return (
    o.sellerId ||
    o.seller_id ||
    o.sellerID ||
    (o.seller && (o.seller.id || o.seller._id || o.seller.userId)) ||
    o.ownerId ||
    (o.owner && (o.owner.id || o.owner._id))
  );
}

export default function OrdersPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const successFlag = sp.get("success");

  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) {
      nav(`/auth?tab=login&redirectTo=${encodeURIComponent("/orders")}`, {
        replace: true,
      });
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const myId = u._id || u.id || u.userId;
        if (!myId) {
          setErr("ไม่พบรหัสผู้ใช้ (id) จาก token");
          setLoading(false);
          return;
        }

        const res = await api.get(`/orders?page=1&limit=50`);
        const all = normalizeOrders(res);

        const myBuyerOrders = all.filter((o) => {
          const bid = getBuyerIdFromOrder(o);
          return bid && String(bid) === String(myId);
        });

        const mySellerOrders = all.filter((o) => {
          const sid = getSellerIdFromOrder(o);
          return sid && String(sid) === String(myId);
        });

        setAllOrders(all);
        setBuyerOrders(myBuyerOrders);
        setSellerOrders(mySellerOrders);
      } catch (e) {
        setErr(e.message || "โหลดคำสั่งซื้อไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  return (
    <MainLayout>
      {/* 🔑 wrapper สำหรับหน้า orders */}
      <div className="h2h-orders max-w-5xl mx-auto p-4 space-y-6">

        {/* ===== Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">
              คำสั่งซื้อของฉัน
            </h1>
            <p className="text-sm text-white/70">
              ดูรายการที่คุณสั่งซื้อ และรายการที่คุณเป็นผู้ขาย
            </p>
          </div>

          <Button type="button" className="text-sm" onClick={() => nav("/items")}>
            กลับไปดูสินค้า
          </Button>
        </div>

        {/* ===== Alerts ===== */}
        {successFlag && (
          <div className="rounded-xl border border-emerald-400/20
                          bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
            ✅ สร้างคำสั่งซื้อเรียบร้อยแล้ว
          </div>
        )}

        {err && (
          <div className="rounded-xl border border-red-400/20
                          bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-white/70">
            กำลังโหลดคำสั่งซื้อ...
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── ฉันเป็นผู้ซื้อ ── */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                ฉันเป็นผู้ซื้อ
              </h2>

              {buyerOrders.length === 0 ? (
                <p className="text-sm text-white/65">
                  ยังไม่มีคำสั่งซื้อในฐานะผู้ซื้อ
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl
                                border border-white/15
                                bg-black/40 backdrop-blur">
                  <table className="min-w-full text-sm">
                    <thead className="bg-black/40">
                      <tr>
                        {["เลขคำสั่งซื้อ","สินค้า","ยอดเงิน","สถานะ","สร้างเมื่อ"].map(h => (
                          <th key={h}
                              className="px-3 py-2 text-left text-xs font-semibold text-white/70">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {buyerOrders.map((o) => {
                        const amount = getAmount(o);
                        const payStatus = getPaymentStatus(o);
                        const statusText = o.status || o.orderStatus || "pending";

                        return (
                          <tr key={o._id}
                              className="border-t border-white/10 hover:bg-white/5">
                            <td className="px-3 py-2 font-mono text-xs text-white">
                              <Link
                                to={`/orders/${o._id}`}
                                className="text-blue-300 hover:underline">
                                {o.orderNumber || o._id}
                              </Link>
                            </td>

                            <td className="px-3 py-2">
                              <div className="text-white">
                                {o.itemSnapshot?.title || o.title || "–"}
                              </div>
                              <div className="text-xs text-white/60">
                                itemId: {o.itemId}
                              </div>
                            </td>

                            <td className="px-3 py-2 text-right text-yellow-300 font-medium">
                              ฿{Number(amount || 0).toLocaleString("th-TH")}
                            </td>

                            <td className="px-3 py-2">
                              <span className="inline-flex items-center rounded-full
                                               border border-white/20 bg-black/40
                                               px-2 py-0.5 text-xs text-white/80">
                                {statusText} / {payStatus}
                              </span>
                            </td>

                            <td className="px-3 py-2 text-xs text-white/60">
                              {formatDate(o.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── ฉันเป็นผู้ขาย ── */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                ฉันเป็นผู้ขาย
              </h2>

              {sellerOrders.length === 0 ? (
                <p className="text-sm text-white/65">
                  ยังไม่มีคำสั่งซื้อในฐานะผู้ขาย
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl
                                border border-white/15
                                bg-black/40 backdrop-blur">
                  <table className="min-w-full text-sm">
                    <thead className="bg-black/40">
                      <tr>
                        {["เลขคำสั่งซื้อ","สินค้า","ยอดเงิน","ผู้ซื้อ","สถานะ"].map(h => (
                          <th key={h}
                              className="px-3 py-2 text-left text-xs font-semibold text-white/70">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.map((o) => {
                        const amount = getAmount(o);
                        const payStatus = getPaymentStatus(o);
                        const statusText = o.status || o.orderStatus || "pending";

                        return (
                          <tr key={o._id}
                              className="border-t border-white/10 hover:bg-white/5">
                            <td className="px-3 py-2 font-mono text-xs text-white">
                              <Link
                                to={`/orders/${o._id}`}
                                className="text-blue-300 hover:underline">
                                {o.orderNumber || o._id}
                              </Link>
                            </td>

                            <td className="px-3 py-2">
                              <div className="text-white">
                                {o.itemSnapshot?.title || o.title || "–"}
                              </div>
                              <div className="text-xs text-white/60">
                                itemId: {o.itemId}
                              </div>
                            </td>

                            <td className="px-3 py-2 text-right text-yellow-300 font-medium">
                              ฿{Number(amount || 0).toLocaleString("th-TH")}
                            </td>

                            <td className="px-3 py-2 text-xs text-white/70">
                              buyerId: {getBuyerIdFromOrder(o) || "-"}
                            </td>

                            <td className="px-3 py-2">
                              <span className="inline-flex items-center rounded-full
                                               border border-white/20 bg-black/40
                                               px-2 py-0.5 text-xs text-white/80">
                                {statusText} / {payStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── Debug ── */}
            <section>
              <h2 className="text-sm font-semibold text-white/80 mb-1">
                ทุกคำสั่งซื้อในระบบ (debug)
              </h2>
              <p className="text-xs text-white/50 mb-2">
                ทั้งหมด: {allOrders.length} ออเดอร์
              </p>

              {allOrders.length > 0 && (
                <div className="overflow-x-auto rounded-xl
                                border border-white/10
                                bg-black/30">
                  <table className="min-w-full text-xs">
                    <thead className="bg-black/40">
                      <tr>
                        {["id","item","buyerId","sellerId","status"].map(h => (
                          <th key={h}
                              className="px-2 py-1 text-left font-semibold text-white/60">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.map((o) => (
                        <tr key={`debug-${o._id}`}
                            className="border-t border-white/10 hover:bg-white/5">
                          <td className="px-2 py-1 font-mono">
                            <Link
                              to={`/orders/${o._id}`}
                              className="text-blue-300 hover:underline">
                              {o._id}
                            </Link>
                          </td>
                          <td className="px-2 py-1 text-white/80">
                            {o.itemSnapshot?.title || o.title || "–"}
                          </td>
                          <td className="px-2 py-1 text-white/60">
                            {String(getBuyerIdFromOrder(o) || o.buyerId || "-")}
                          </td>
                          <td className="px-2 py-1 text-white/60">
                            {String(getSellerIdFromOrder(o) || o.sellerId || "-")}
                          </td>
                          <td className="px-2 py-1 text-white/70">
                            {o.status || o.orderStatus || "pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
