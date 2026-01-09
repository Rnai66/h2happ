import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { authFetch } from "../../api/authFetch";
import DashboardPage from "../DashboardPage";
import { formatOrderNumber } from "../../utils/formatOrderNumber";
import { useAuth } from "../../context/AuthContext";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "sold", label: "Sold" },
];

function formatTHB(n) {
  const num = Number(n || 0);
  return num.toLocaleString("th-TH");
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const base =
    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border";
  if (s === "draft") return <span className={`${base} bg-slate-50 border-slate-200 text-slate-700`}>Draft</span>;
  if (s === "active") return <span className={`${base} bg-emerald-50 border-emerald-100 text-emerald-700`}>Active</span>;
  if (s === "sold") return <span className={`${base} bg-amber-50 border-amber-100 text-amber-700`}>Sold</span>;
  if (s === "hidden") return <span className={`${base} bg-slate-50 border-slate-200 text-slate-600`}>Hidden</span>;
  if (s === "reserved") return <span className={`${base} bg-indigo-50 border-indigo-100 text-indigo-700`}>Reserved</span>;
  return <span className={`${base} bg-slate-50 border-slate-200 text-slate-600`}>{status || "-"}</span>;
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2.5 text-sm font-medium rounded-full border whitespace-nowrap shadow-sm",
        active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * Optimistic helpers
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function MyListings() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const [lists, setLists] = useState({
    draft: [],
    active: [],
    sold: [],
  });

  const [counts, setCounts] = useState({ draft: 0, active: 0, sold: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const inflightRef = useRef(new Map()); // id -> previousSnapshot (for rollback)

  /* ===== NEW: Order Helpers & State ===== */
  const [sellerOrders, setSellerOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState("");

  function formatDate(dt) {
    if (!dt) return "-";
    try {
      return new Date(dt).toLocaleString("th-TH");
    } catch {
      return String(dt);
    }
  }
  function getAmount(o) {
    return o.amount || o.price || o.total || 0;
  }
  function getPaymentStatus(o) {
    return o.paymentStatus || o.payment_status || "unpaid";
  }
  function getBuyerIdFromOrder(o) {
    if (!o) return "-";
    return (
      o.buyerId ||
      o.buyer_id ||
      (o.buyer && (o.buyer.id || o.buyer._id)) ||
      o.userId ||
      "-"
    );
  }

  const currentItems = useMemo(() => {
    if (tab === "overview") return [];
    const items = lists[tab] || [];
    const kw = q.trim().toLowerCase();
    if (!kw) return items;
    return items.filter((it) => (it.title || "").toLowerCase().includes(kw));
  }, [lists, tab, q]);

  async function loadOne(statusKey, { silent = false } = {}) {
    if (!silent) {
      setErr("");
      setLoading(true);
    }
    try {
      const data = await authFetch(
        `/api/items/me?status=${encodeURIComponent(statusKey)}&limit=60`
      );
      const items = Array.isArray(data?.items) ? data.items : [];
      setLists((prev) => ({ ...prev, [statusKey]: items }));
      setCounts((prev) => ({ ...prev, [statusKey]: Number(data?.total ?? items.length) }));
    } catch (e) {
      if (e.status === 401) nav("/login");
      else setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadAll({ silent = false } = {}) {
    // โหลดครบทั้ง 3 แท็บเพื่อทำ counter + สลับแท็บเร็ว
    setErr("");
    if (!silent) setLoading(true);
    try {
      const [d, a, s] = await Promise.all([
        authFetch(`/api/items/me?status=draft&limit=60`),
        authFetch(`/api/items/me?status=active&limit=60`),
        authFetch(`/api/items/me?status=sold&limit=60`),
      ]);
      const draft = Array.isArray(d?.items) ? d.items : [];
      const active = Array.isArray(a?.items) ? a.items : [];
      const sold = Array.isArray(s?.items) ? s.items : [];
      setLists({ draft, active, sold });
      setCounts({
        draft: Number(d?.total ?? draft.length),
        active: Number(a?.total ?? active.length),
        sold: Number(s?.total ?? sold.length),
      });
    } catch (e) {
      if (e.status === 401) nav("/login");
      else setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moveItemOptimistic(itemId, from, to, patch = {}) {
    setLists((prev) => {
      const next = clone(prev);
      const fromList = next[from] || [];
      const idx = fromList.findIndex((x) => x._id === itemId);
      if (idx === -1) return prev;

      const item = { ...fromList[idx], ...patch };
      fromList.splice(idx, 1);
      next[from] = fromList;

      // insert top of target
      next[to] = [item, ...(next[to] || [])];

      return next;
    });

    setCounts((prev) => ({
      ...prev,
      [from]: Math.max(0, (prev[from] || 0) - 1),
      [to]: (prev[to] || 0) + 1,
    }));
  }

  function updateItemOptimistic(itemId, inTab, patch = {}) {
    setLists((prev) => {
      const next = clone(prev);
      next[inTab] = (next[inTab] || []).map((x) =>
        x._id === itemId ? { ...x, ...patch } : x
      );
      return next;
    });
  }

  function removeItemOptimistic(itemId, inTab) {
    setLists((prev) => {
      const next = clone(prev);
      const before = next[inTab] || [];
      next[inTab] = before.filter((x) => x._id !== itemId);
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [inTab]: Math.max(0, (prev[inTab] || 0) - 1),
    }));
  }

  async function patchStatus(item, nextStatus) {
    if (!item?._id) return;
    setErr("");

    const currentStatus = String(item.status || "").toLowerCase();
    const fromTab = currentStatus === "active" ? "active" : currentStatus === "sold" ? "sold" : "draft";
    const toTab = nextStatus === "active" ? "active" : nextStatus === "sold" ? "sold" : "draft";

    // snapshot for rollback
    inflightRef.current.set(item._id, { lists: clone(lists), counts: clone(counts) });

    // optimistic: move between tabs if needed
    if (fromTab !== toTab) moveItemOptimistic(item._id, fromTab, toTab, { status: nextStatus });
    else updateItemOptimistic(item._id, fromTab, { status: nextStatus });

    try {
      await authFetch(`/api/items/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      // refresh that tab silently to sync
      await loadAll({ silent: true });
    } catch (e) {
      // rollback
      const snap = inflightRef.current.get(item._id);
      if (snap) {
        setLists(snap.lists);
        setCounts(snap.counts);
      }
      setErr(e.message || "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      inflightRef.current.delete(item._id);
    }
  }

  async function softDelete(item) {
    if (!item?._id) return;
    const ok = window.confirm("ลบสินค้านี้แบบซ่อน (soft delete) ใช่ไหม?");
    if (!ok) return;

    setErr("");

    const currentStatus = String(item.status || "").toLowerCase();
    const inTab = currentStatus === "active" ? "active" : currentStatus === "sold" ? "sold" : "draft";

    inflightRef.current.set(item._id, { lists: clone(lists), counts: clone(counts) });

    // optimistic remove
    removeItemOptimistic(item._id, inTab);

    try {
      await authFetch(`/api/items/${item._id}`, { method: "DELETE" });
      await loadAll({ silent: true });
    } catch (e) {
      const snap = inflightRef.current.get(item._id);
      if (snap) {
        setLists(snap.lists);
        setCounts(snap.counts);
      }
      setErr(e.message || "ลบไม่สำเร็จ");
    } finally {
      inflightRef.current.delete(item._id);
    }
  }

  // Fetch Seller Orders when tab is 'sold'
  useEffect(() => {
    if (tab === "sold") {
      loadSellerOrders();
    }
  }, [tab]);

  async function loadSellerOrders() {
    setLoading(true);
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      const myId = u._id || u.id;
      if (!myId) return;

      const res = await authFetch(`/api/orders?sellerId=${myId}&limit=100`);
      const orders = Array.isArray(res.orders) ? res.orders : (Array.isArray(res) ? res : []);
      setSellerOrders(orders);
    } catch (e) {
      console.error("Failed to load seller orders", e);
    } finally {
      setLoading(false);
    }
  }

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
      await authFetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: editStatus }),
      });
      setEditingId(null);
      setSellerOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: editStatus } : o))
      );
      // refresh stats
      loadAll({ silent: true });
    } catch (e) {
      alert(e.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">สินค้าของฉัน</h1>
            <p className="text-xs text-gray-700 dark:text-gray-400">จัดการรายการขาย</p>
          </div>

          <div className="flex gap-2">
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium"
              >
                🔒 Admin
              </Link>
            )}
            <Link
              to="/settings"
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium border border-gray-300 dark:border-slate-600"
            >
              ⚙️ Settings
            </Link>
            <Link
              to="/sell"
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
            >
              + ลงขาย
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              {t.key !== 'overview' && <span className="ml-1 opacity-90">({counts[t.key] || 0})</span>}
            </TabButton>
          ))}
        </div>

        {tab === "overview" ? (
          <div className="mt-4">
            <DashboardPage />
          </div>
        ) : tab === "sold" ? (
          <div className="mt-4">
            {/* Print Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm no-print"
              >
                <span className="material-icons-round text-sm">print</span>
                <span className="text-sm font-medium">Print Report</span>
              </button>
            </div>

            {sellerOrders.length === 0 ? (
              <div className="text-sm text-[var(--text-muted)] h2h-card p-4 text-center">
                ยังไม่มีคำสั่งซื้อ (รายการที่ขายแล้ว)
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--glass-border)] h2h-card shadow-sm print:shadow-none print:border-none">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-slate-200 dark:bg-black/30 border-b border-[var(--glass-border)] print:bg-white print:border-black">
                    <tr>
                      {["Order ID", "商品 (Item)", "ยอดเงิน", "ผู้ซื้อ", "สถานะ", "อัปเดตล่าสุด", "จัดการ"].map((h) => (
                        <th key={h} className="px-2 py-2 md:px-4 md:py-3 font-medium text-[var(--text-muted)] print:text-black text-[10px] md:text-sm">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border)] print:divide-black">
                    {sellerOrders.map((o) => {
                      const amount = getAmount(o);
                      const payStatus = getPaymentStatus(o);
                      const statusText = o.status || "pending";
                      const isEditing = editingId === o._id;

                      return (
                        <tr key={o._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors print:hover:bg-white">
                          <td className="px-2 py-2 md:px-4 md:py-3">
                            <div className="font-mono text-[10px] md:text-xs text-[var(--text-main)] print:text-black">{formatOrderNumber(o.orderNumber, "seller") || o._id}</div>
                            <div className="text-[9px] md:text-[10px] text-[var(--text-muted)] print:text-black">{formatDate(o.createdAt)}</div>
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3">
                            <div className="text-[var(--text-main)] font-medium line-clamp-1 text-xs md:text-sm print:text-black max-w-[100px] md:max-w-none">
                              {o.itemSnapshot?.title || "Unknown Item"}
                            </div>
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 font-semibold text-blue-600 print:text-black text-xs md:text-sm">
                            ฿{Number(amount).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-xs text-slate-500 print:text-black">
                            {getBuyerIdFromOrder(o)}
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3">
                            {isEditing ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="border border-slate-300 rounded px-1 py-1 text-xs bg-white text-slate-700 no-print"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border print:border-black print:text-black print:bg-white ${statusText === "completed"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : statusText === "confirmed"
                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                    : statusText === "cancelled"
                                      ? "bg-red-50 text-red-600 border-red-100"
                                      : "bg-amber-50 text-amber-600 border-amber-100"
                                  }`}
                              >
                                {statusText}
                              </span>
                            )}
                            <div className="text-[9px] md:text-[10px] text-[var(--text-muted)] mt-0.5 capitalize print:text-black">
                              {payStatus}
                            </div>
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-xs text-[var(--text-muted)] print:text-black">
                            {formatDate(o.updatedAt || o.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={() => handleSaveStatus(o._id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                                    <span className="material-icons-round text-lg">save</span>
                                  </button>
                                  <button onClick={cancelEdit} className="text-slate-400 hover:bg-slate-50 p-1 rounded">
                                    <span className="material-icons-round text-lg">close</span>
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => startEdit(o)} className="text-blue-500 hover:bg-blue-50 p-1 rounded">
                                  <span className="material-icons-round text-lg">edit</span>
                                </button>
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
          </div>
        ) : (
          <>
            {/* Search + refresh */}
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาในรายการของฉัน…"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white"
                style={{ color: '#000000' }}
              />
              <button
                onClick={() => loadAll()}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
              >
                รีเฟรช
              </button>
            </div>

            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                {err}
              </div>
            )}

            {loading ? (
              <div className="text-sm font-medium" style={{ color: '#374151' }}>กำลังโหลด…</div>
            ) : currentItems.length === 0 ? (
              <div className="text-sm bg-white border border-gray-200 rounded-2xl p-6 shadow-sm" style={{ color: '#374151' }}>
                ยังไม่มีสินค้าในแท็บนี้
              </div>
            ) : (
              <ul className="space-y-3">
                {currentItems.map((it) => {
                  const status = String(it.status || "").toLowerCase();
                  const isDraft = status === "draft";
                  const isActive = status === "active";
                  const isSold = status === "sold";

                  return (
                    <li
                      key={it._id}
                      className="h2h-card border border-[var(--glass-border)] rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-xs text-slate-500 shrink-0">
                          {it.images?.[0] ? (
                            <img
                              src={it.images[0]}
                              alt="item"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "No image"
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                to={`/items/${it._id}`}
                                className="font-bold line-clamp-2"
                                style={{ color: '#000000' }}
                              >
                                {it.title}
                              </Link>

                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-sm font-bold" style={{ color: '#ea580c' }}>
                                  ฿ {formatTHB(it.price)}
                                </div>
                                <StatusBadge status={it.status} />
                              </div>

                              {it.description ? (
                                <div className="text-xs mt-1 line-clamp-1" style={{ color: '#4b5563' }}>
                                  {it.description}
                                </div>
                              ) : null}
                            </div>

                            <button
                              onClick={() => softDelete(it)}
                              className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-700"
                            >
                              ลบ
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Link
                              to={`/sell?edit=${it._id}`}
                              className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                            >
                              Edit
                            </Link>

                            {isDraft && (
                              <button
                                onClick={() => patchStatus(it, "active")}
                                className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white"
                              >
                                Publish
                              </button>
                            )}

                            {isActive && (
                              <>
                                <button
                                  onClick={() => patchStatus(it, "sold")}
                                  className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                                >
                                  Mark Sold
                                </button>
                                <button
                                  onClick={() => patchStatus(it, "draft")}
                                  className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                                >
                                  Unpublish
                                </button>
                              </>
                            )}

                            {isSold && (
                              <button
                                onClick={() => patchStatus(it, "active")}
                                className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                              >
                                Relist
                              </button>
                            )}



                            {isActive && (
                              <>
                                <button
                                  onClick={() => patchStatus(it, "sold")}
                                  className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                                >
                                  Mark Sold
                                </button>
                                <button
                                  onClick={() => patchStatus(it, "draft")}
                                  className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                                >
                                  Unpublish
                                </button>
                              </>
                            )}

                            {isSold && (
                              <button
                                onClick={() => patchStatus(it, "active")}
                                className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                              >
                                Relist
                              </button>
                            )}

                            {/* optional: hidden/reserved support if backend supports */}
                            {(status === "hidden" || status === "reserved") && (
                              <button
                                onClick={() => patchStatus(it, "active")}
                                className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                              >
                                Restore Active
                              </button>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 mt-3">
                            updated: {new Date(it.updatedAt || it.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </MainLayout >
  );
}
