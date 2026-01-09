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

// Import order number formatting from shared utility
import { formatOrderNumber } from "../../utils/formatOrderNumber";

export default function OrdersPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const successFlag = sp.get("success");

  const [buyerOrders, setBuyerOrders] = useState([]);

  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState("");

  const refreshOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders?page=1&limit=50`);
      const all = normalizeOrders(res);
      const u = getUser();
      const myId = u?._id || u?.id || u?.userId;

      if (myId) {
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("คุณต้องการลบคำสั่งซื้อนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/orders/${id}`);
      setAllOrders((prev) => prev.filter((o) => o._id !== id));
      setBuyerOrders((prev) => prev.filter((o) => o._id !== id));

      alert("ลบคำสั่งซื้อเรียบร้อยแล้ว");
    } catch (e) {
      alert(e.message || "ลบคำสั่งซื้อไม่สำเร็จ");
    }
  };

  const startEdit = (order) => {
    setEditingId(order._id);
    setEditStatus(order.status || "pending");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStatus("");
  };

  const handleSaveStatus = async (id) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: editStatus });
      setEditingId(null);
      // Update local state to reflect change without full reload
      const updateLocal = (list) => list.map(o => o._id === id ? { ...o, status: editStatus } : o);
      setAllOrders(updateLocal);
      setBuyerOrders(updateLocal);

      alert("อัปเดตสถานะเรียบร้อยแล้ว");
    } catch (e) {
      alert(e.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

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

        setAllOrders(all);
        setBuyerOrders(myBuyerOrders);
      } catch (e) {
        setErr(e.message || "โหลดคำสั่งซื้อไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  const StatusSelect = () => (
    <select
      value={editStatus}
      onChange={(e) => setEditStatus(e.target.value)}
      className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded px-2 py-1 text-xs text-slate-800 dark:text-white"
      onClick={(e) => e.stopPropagation()}
    >
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );

  return (
    <MainLayout>
      {/* 🔑 wrapper สำหรับหน้า orders */}
      <div className="h2h-orders max-w-6xl mx-auto p-4 space-y-6">

        {/* ===== Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] title-glow">
              คำสั่งซื้อของฉัน
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
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
          <div className="text-sm text-[var(--text-muted)]">
            กำลังโหลดคำสั่งซื้อ...
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── ฉันเป็นผู้ซื้อ ── */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--text-main)] mb-2">
                ฉันเป็นผู้ซื้อ
              </h2>

              {buyerOrders.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  ยังไม่มีคำสั่งซื้อในฐานะผู้ซื้อ
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl
                                border border-[var(--glass-border)]
                                h2h-card">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-200 dark:bg-black/40">
                      <tr>
                        {["เลขคำสั่งซื้อ", "สินค้า", "ยอดเงิน", "สถานะ", "จัดการ"].map(h => (
                          <th key={h}
                            className="px-2 py-2 md:px-3 md:py-2 text-left text-[10px] md:text-xs font-semibold text-[var(--text-muted)]">
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
                        const isEditing = editingId === o._id;

                        return (
                          <tr key={o._id}
                            className="border-t border-[var(--glass-border)] hover:bg-black/5 dark:hover:bg-white/5">
                            <td className="px-2 py-2 md:px-3 md:py-2 font-mono text-[10px] md:text-xs text-[var(--text-main)]">
                              <Link
                                to={`/orders/${o._id}`}
                                className="text-blue-600 dark:text-blue-300 hover:underline">
                                {formatOrderNumber(o.orderNumber, "buyer") || o._id}
                              </Link>
                              <div className="text-[9px] md:text-[10px] text-[var(--text-muted)] mt-1">
                                {formatDate(o.createdAt)}
                              </div>
                            </td>

                            <td className="px-2 py-2 md:px-3 md:py-2">
                              <div className="text-[var(--text-main)] text-xs md:text-sm line-clamp-1 max-w-[120px] md:max-w-none">
                                {o.itemSnapshot?.title || o.title || "–"}
                              </div>
                            </td>

                            <td className="px-2 py-2 md:px-3 md:py-2 text-right text-[var(--text-accent)] font-medium text-xs md:text-sm">
                              ฿{Number(amount || 0).toLocaleString("th-TH")}
                            </td>

                            <td className="px-2 py-2 md:px-3 md:py-2">
                              {isEditing ? (
                                <StatusSelect />
                              ) : (
                                <span className={`inline-flex items-center rounded-full
                                                   border px-1.5 py-0.5 md:px-2 text-[10px] md:text-xs
                                                   ${statusText === 'completed' ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400' :
                                    statusText === 'cancelled' ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400' :
                                      'border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 text-slate-700 dark:text-white/80'}`}>
                                  {statusText} / {payStatus}
                                </span>
                              )}
                            </td>

                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => handleSaveStatus(o._id)} className="text-green-400 hover:text-green-300">
                                      <span className="material-icons-round text-lg">save</span>
                                    </button>
                                    <button onClick={cancelEdit} className="text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white">
                                      <span className="material-icons-round text-lg">close</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(o)} className="text-blue-400 hover:text-blue-300" title="แก้ไขสถานะ">
                                      <span className="material-icons-round text-lg">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(o._id)} className="text-red-400 hover:text-red-300" title="ลบคำสั่งซื้อ">
                                      <span className="material-icons-round text-lg">delete</span>
                                    </button>
                                  </>
                                )}
                              </div>
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
    </MainLayout >
  );
}
