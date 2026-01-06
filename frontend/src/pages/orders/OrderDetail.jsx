import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import PayButton from "./PayButton";
import { useAuth } from "../../context/AuthContext";
import ReceiptQRCode from "../../components/ReceiptQRCode";

/* helpers */
function fmtDate(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString("th-TH");
  } catch {
    return String(dt);
  }
}
function getOrderAmount(o) {
  if (!o) return 0;
  if (typeof o.amount === "number") return o.amount;
  if (typeof o.total === "number") return o.total;
  if (typeof o.price === "number") return o.price;
  return 0;
}

/* logo */
function H2HLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#g)" />
      <path
        d="M16 20v24M48 20v24M16 32h32"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ===== Print handlers (ไม่ต้องแตะ console) ===== */
function handlePrint(size = "a4") {
  document.documentElement.classList.remove("paper-a4", "paper-80");
  document.documentElement.classList.add(size === "80" ? "paper-80" : "paper-a4");
  setTimeout(() => window.print(), 50);
}

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, tokenBalance, refreshProfile } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [payMethod, setPayMethod] = useState("cash");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        const ord = res.order || res;
        if (!ord?._id) setErr("ไม่พบคำสั่งซื้อ");
        else setOrder(ord);
      } catch (e) {
        setErr(e.message || "โหลดคำสั่งซื้อไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* watermark PAID / UNPAID */
  useEffect(() => {
    if (!order) return;
    const paid =
      order.paymentStatus === "paid" || order.status === "completed";
    document.body.setAttribute("data-paid", paid ? "PAID" : "UNPAID");
  }, [order]);

  const amount = useMemo(() => getOrderAmount(order), [order]);
  const isPaid =
    order?.paymentStatus === "paid" || order?.status === "completed";
  const isBuyer = user && order && String(user._id) === String(order.buyerId);
  const isSeller = user && order && String(user._id) === String(order.sellerId);

  const itemTitle =
    order?.itemSnapshot?.title || order?.title || "สินค้า";
  const itemImage =
    order?.itemSnapshot?.images?.[0] ||
    "https://placehold.co/400x300?text=H2H";

  return (
    <MainLayout>
      <div className="h2h-orders max-w-4xl mx-auto p-4 space-y-6">

        {/* ===== Header ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
              รายละเอียดคำสั่งซื้อ
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              เลขคำสั่งซื้อ:
              <span className="font-mono ml-1 font-bold" style={{ color: 'var(--text-main)' }}>
                {order?.orderNumber || order?._id}
              </span>
            </p>
          </div>

          <div className="flex gap-2 no-print">
            <Button onClick={() => handlePrint("a4")}>🖨 พิมพ์ A4</Button>
            <Button
              onClick={() => handlePrint("80")}
              className="border transition hover:brightness-110"
              style={{
                background: 'var(--bg-frame)',
                color: 'var(--text-main)',
                borderColor: 'var(--border-color)'
              }}
            >
              🧾 พิมพ์ 80mm
            </Button>
          </div>
        </div>

        {loading && <p className="text-white/70">กำลังโหลด...</p>}
        {err && <p className="text-red-300">{err}</p>}

        {!loading && order && (
          <>
            {/* ===== Summary ===== */}
            <div className="grid md:grid-cols-[1.6fr,1.2fr] gap-4">
              <Card className="h2h-card" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="p-4 flex gap-3">
                  <img
                    src={itemImage}
                    alt={itemTitle}
                    className="w-28 h-28 rounded-xl object-cover border"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <H2HLogo />
                      <span className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                        H2H Thailand
                      </span>
                    </div>
                    <h2 className="font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                      {itemTitle}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      ผู้ซื้อ: <b style={{ color: 'var(--text-main)' }}>{order.buyerId}</b>
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      ผู้ขาย: <b style={{ color: 'var(--text-main)' }}>{order.sellerId}</b>
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      สร้างเมื่อ: {fmtDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="h2h-card" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span>สถานะ</span>
                    <span className="px-2 py-0.5 rounded-full border text-xs" style={{
                      background: 'var(--bg-frame)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)'
                    }}>
                      {order.status} / {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span style={{ color: 'var(--text-main)' }}>ยอดชำระ</span>
                    <span className="text-lg" style={{ color: 'var(--accent-primary)' }}>
                      ฿{Number(amount).toLocaleString("th-TH")}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* ===== Payment ===== */}
            <Card className="h2h-card no-print" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="p-4 space-y-4">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                  วิธีการชำระเงิน
                </h2>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["cash", "เงินสด"],
                    ["transfer", "โอนบัญชี"],
                    ["promptpay", "พร้อมเพย์"],
                    ["paypal", "PayPal"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPayMethod(id)}
                      className={`px-3 py-1.5 rounded-full text-xs border
                        ${payMethod === id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-black/30 text-white/70 border-white/20"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {!isPaid && (
                  <PayButton
                    orderId={order._id}
                    amount={amount}
                    method={payMethod}
                  >
                    💳 ชำระเงิน
                  </PayButton>
                )}

                {isPaid && (
                  <p className="text-emerald-300 text-sm">
                    ✅ ชำระเงินเรียบร้อยแล้ว
                  </p>
                )}
              </div>
            </Card>

            {/* ===== Receipt (Print Only) ===== */}
            <div className="receipt print-only">
              <div className="receipt-header">
                <div className="receipt-brand">H2H Thailand</div>
                <div className="receipt-sub">ใบเสร็จรับเงิน / Receipt</div>
              </div>

              <div className="receipt-row">
                <span>Order No</span>
                <b>{order.orderNumber || order._id}</b>
              </div>

              <div className="receipt-row">
                <span>Date</span>
                <b>{fmtDate(order.createdAt)}</b>
              </div>

              <div className="receipt-row">
                <span>Item</span>
                <b>{itemTitle}</b>
              </div>

              <div className="receipt-row total">
                <span>Total</span>
                <b>฿{Number(amount).toLocaleString("th-TH")}</b>
              </div>

              <ReceiptQRCode
                value={`${window.location.origin}/orders/${order._id}`}
              />
            </div>

            {/* ===== Token ===== */}
            <Card className="h2h-card no-print">
              <div className="p-4 space-y-2">
                <h2 className="text-sm font-semibold text-white">
                  Token & Reputation (ทดลอง)
                </h2>
                <p className="text-xs text-white/70">
                  Token ปัจจุบันของคุณ:
                  <b className="text-white ml-1">{tokenBalance ?? 0}</b>
                </p>

                {order.status === "completed" && (
                  <div className="flex gap-2">
                    {isBuyer && (
                      <Button onClick={() => refreshProfile()}>
                        🎁 รับ Token (Buyer)
                      </Button>
                    )}
                    {isSeller && (
                      <Button onClick={() => refreshProfile()}>
                        🎁 รับ Token (Seller)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
