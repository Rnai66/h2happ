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

        // Parallel fetch for buyer and seller orders
        const [buyerRes, sellerRes] = await Promise.all([
          api.get(`/orders?page=1&limit=50&buyerId=${myId}`),
          api.get(`/orders?page=1&limit=50&sellerId=${myId}`)
        ]);

        setBuyerOrders(normalizeOrders(buyerRes));
        setSellerOrders(normalizeOrders(sellerRes));

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
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
              คำสั่งซื้อของฉัน
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
                ฉันเป็นผู้ซื้อ
              </h2>

              {buyerOrders.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  ยังไม่มีคำสั่งซื้อในฐานะผู้ซื้อ
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border backdrop-blur"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <table className="min-w-full text-sm">
                    <thead style={{ background: 'var(--bg-frame)' }}>
                      <tr>
                        {["เลขคำสั่งซื้อ", "สินค้า", "ยอดเงิน", "สถานะ", "สร้างเมื่อ"].map(h => (
                          <th key={h}
                            className="px-3 py-2 text-left text-xs font-semibold"
                            style={{ color: 'var(--text-muted)' }}>
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
                            className="border-t transition"
                            style={{ borderColor: 'var(--border-color)' }}>
                            <td className="px-3 py-2 font-mono text-xs">
                              <Link
                                to={`/orders/${o._id}`}
                                className="hover:underline"
                                style={{ color: 'var(--accent-primary)' }}>
                                {o.orderNumber || o._id}
                              </Link>
                            </td>

                            <td className="px-3 py-2">
                              <div style={{ color: 'var(--text-main)' }}>
                                {o.itemSnapshot?.title || o.title || "–"}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                itemId: {o.itemId}
                              </div>
                            </td>

                            <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--text-accent)' }}>
                              ฿{Number(amount || 0).toLocaleString("th-TH")}
                            </td>

                            <td className="px-3 py-2">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border"
                                style={{
                                  color: 'var(--text-muted)',
                                  borderColor: 'var(--border-color)',
                                  background: 'var(--bg-frame)'
                                }}>
                                {statusText} / {payStatus}
                              </span>
                            </td>

                            <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
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
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
                ฉันเป็นผู้ขาย
              </h2>

              {sellerOrders.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  ยังไม่มีคำสั่งซื้อในฐานะผู้ขาย
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border backdrop-blur"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <table className="min-w-full text-sm">
                    <thead style={{ background: 'var(--bg-frame)' }}>
                      <tr>
                        {["เลขคำสั่งซื้อ", "สินค้า", "ยอดเงิน", "ผู้ซื้อ", "สถานะ"].map(h => (
                          <th key={h}
                            className="px-3 py-2 text-left text-xs font-semibold"
                            style={{ color: 'var(--text-muted)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.map((o) => {
                        const amount = getAmount(o);
                        // const payStatus = getPaymentStatus(o);
                        const statusText = o.status || o.orderStatus || "pending";

                        return (
                          <tr key={o._id}
                            className="border-t transition"
                            style={{ borderColor: 'var(--border-color)' }}>
                            <td className="px-3 py-2 font-mono text-xs">
                              <Link
                                to={`/orders/${o._id}`}
                                className="hover:underline"
                                style={{ color: 'var(--accent-primary)' }}>
                                {o.orderNumber || o._id}
                              </Link>
                            </td>

                            <td className="px-3 py-2">
                              <div style={{ color: 'var(--text-main)' }}>
                                {o.itemSnapshot?.title || o.title || "–"}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                itemId: {o.itemId}
                              </div>
                            </td>

                            <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--text-accent)' }}>
                              ฿{Number(amount || 0).toLocaleString("th-TH")}
                            </td>

                            <td className="px-3 py-2" style={{ color: 'var(--text-main)' }}>
                              <div>{o.buyerSnapshot?.name || "–"}</div>
                            </td>

                            <td className="px-3 py-2">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border"
                                style={{
                                  color: 'var(--text-muted)',
                                  borderColor: 'var(--border-color)',
                                  background: 'var(--bg-frame)'
                                }}>
                                {statusText}
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
          </div>
        )}
      </div>
    </MainLayout>
  );
}
