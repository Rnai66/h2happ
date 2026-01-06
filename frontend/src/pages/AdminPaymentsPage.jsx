// src/pages/AdminPaymentsPage.jsx
import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    buyerId: "",
    sellerId: "",
    orderId: "",
  });

  async function loadPayments(pageToLoad = 1) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", pageToLoad.toString());
      params.set("limit", "20");

      if (filters.buyerId.trim()) params.set("buyerId", filters.buyerId.trim());
      if (filters.sellerId.trim())
        params.set("sellerId", filters.sellerId.trim());
      if (filters.orderId.trim()) params.set("orderId", filters.orderId.trim());

      const res = await fetch(
        `${API_BASE}/api/pay/admin/pending?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to load payments: ${res.status} ${text}`);
      }

      const data = await res.json();
      setPayments(data.payments || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("loadPayments error", err);
      setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(paymentId) {
    if (!paymentId) return;
    const confirmVerify = window.confirm("ยืนยันอนุมัติสลิปนี้ใช่ไหม?");
    if (!confirmVerify) return;

    try {
      setVerifyingId(paymentId);
      setError("");

      const res = await fetch(`${API_BASE}/api/pay/${paymentId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Verify failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      console.log("verify result:", data);

      setPayments((prev) => prev.filter((p) => p._id !== paymentId));
    } catch (err) {
      console.error("handleVerify error", err);
      setError(err.message || "อนุมัติสลิปไม่สำเร็จ");
    } finally {
      setVerifyingId(null);
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    loadPayments(1);
  }

  function handleResetFilters() {
    setFilters({ buyerId: "", sellerId: "", orderId: "" });
    loadPayments(1);
  }

  function nextPage() {
    if (page < totalPages) {
      const next = page + 1;
      loadPayments(next);
    }
  }

  function prevPage() {
    if (page > 1) {
      const prev = page - 1;
      loadPayments(prev);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Admin – Pending Payments
          </h1>
          <p className="text-sm text-gray-500">
            รายการสลิป/การชำระเงินที่รอแอดมินตรวจสอบและอนุมัติ
          </p>
        </div>
        <button
          onClick={() => loadPayments(page)}
          className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >
          รีเฟรช
        </button>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Buyer ID
          </label>
          <input
            type="text"
            name="buyerId"
            value={filters.buyerId}
            onChange={handleFilterChange}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="เช่น buyer-001 หรือ ObjectId"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Seller ID
          </label>
          <input
            type="text"
            name="sellerId"
            value={filters.sellerId}
            onChange={handleFilterChange}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="เช่น user-001 หรือ ObjectId"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Order ID
          </label>
          <input
            type="text"
            name="orderId"
            value={filters.orderId}
            onChange={handleFilterChange}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="ObjectId ของ Order"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            disabled={loading}
          >
            ค้นหา
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            ล้าง
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left">Payment</th>
                <th className="px-3 py-2 text-left">Order / Item</th>
                <th className="px-3 py-2 text-left">Buyer / Seller</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-center">Method</th>
                <th className="px-3 py-2 text-center">Slip</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    ไม่มีสลิป/การชำระเงินที่รออนุมัติ
                  </td>
                </tr>
              )}

              {payments.map((p) => {
                const shortId = p._id.slice(-6);
                const orderInfo = p.orderInfo || {};
                const shortOrderId = p.orderId
                  ? p.orderId.toString().slice(-6)
                  : "";
                const slipUrl = p.slipImageUrl
                  ? `${API_BASE}${p.slipImageUrl}`
                  : null;

                const methodLabel =
                  p.method === "paypal"
                    ? "PayPal"
                    : p.method === "transfer"
                    ? "โอนบัญชี"
                    : p.method === "promptpay"
                    ? "พร้อมเพย์"
                    : p.method === "card"
                    ? "บัตร (mock)"
                    : "เงินสด/อื่น ๆ";

                return (
                  <tr key={p._id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 align-top">
                      <div className="font-mono text-xs text-gray-700">
                        ...{shortId}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleString()
                          : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="text-xs text-gray-700">
                        Order: {orderInfo.orderNumber || shortOrderId || "-"}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate max-w-xs">
                        สินค้า: {orderInfo.itemTitle || "(ไม่ทราบชื่อสินค้า)"}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        สถานะออเดอร์: {orderInfo.status || "pending"} /{" "}
                        {orderInfo.paymentStatus || "unpaid"}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="text-xs text-gray-700">
                        Buyer:{" "}
                        <span className="font-mono">{p.buyerId || "-"}</span>
                      </div>
                      <div className="text-xs text-gray-700">
                        Seller:{" "}
                          <span className="font-mono">{p.sellerId || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right align-top">
                      <div className="text-sm font-semibold">
                        {p.amount?.toLocaleString("th-TH")}{" "}
                        {p.currency || "THB"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      <span className="inline-flex px-2 py-1 rounded-full text-[11px] bg-slate-100 border border-slate-200 text-slate-700">
                        {methodLabel}
                      </span>
                      {p.buyerTokenRewarded || p.sellerTokenRewarded ? (
                        <div className="mt-1 text-[10px] text-emerald-700">
                          🎟 โทเคนมอบแล้ว
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      {slipUrl ? (
                        <a
                          href={slipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block"
                        >
                          <img
                            src={slipUrl}
                            alt="Slip"
                            className="w-16 h-16 object-cover rounded border"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">
                          (ไม่มีสลิป)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      <button
                        onClick={() => handleVerify(p._id)}
                        disabled={verifyingId === p._id}
                        className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {verifyingId === p._id
                          ? "กำลังอนุมัติ..."
                          : "อนุมัติสลิป"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-3 text-center text-gray-500"
                  >
                    กำลังโหลด...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 text-xs">
          <div>
            หน้า {page} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevPage}
              disabled={page <= 1 || loading}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={page >= totalPages || loading}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPaymentsPage;
