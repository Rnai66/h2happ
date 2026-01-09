import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { api, API_BASE } from "../../lib/api";
import PayButton from "./PayButton";
import { useAuth } from "../../context/AuthContext";
import ReceiptQRCode from "../../components/ReceiptQRCode";
import { formatOrderNumber } from "../../utils/formatOrderNumber";

/* helpers */
/* helpers */
function generatePromptPayPayload(mobile, amount) {
  // Simple CRC16 (XMODEM)
  function crc16(data) {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
      x ^= x >> 4;
      crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  const target = mobile.replace(/^0/, "66"); // Convert 08x to 668x
  const amt = amount.toFixed(2);

  // Tag 00: Version 01
  // Tag 01: QR Type (11 for static/dynamic? 12 for dynamic) -> 11 is repriceable? 
  // Standard PromptPay Static: 
  // 000201 010211 2937 (AID A000000677010111) (01 13 00668xxxxxxxx)
  // 5802TH 5303764 54xxAmount

  const aid = "0016A000000677010111"; // AID for PromptPay

  // 29: Merchant Account Information
  // 01: Mobile Number
  // Length of 0066...
  const acc = `011300${target}`;
  const merchantInfo = `00${aid.length.toString().padStart(2, "0")}${aid}${acc}`; // Wait, nested TLV? 
  // Actually, Merchant Info Tag 29:
  // SubTag 00 (AID)
  // SubTag 01 (Mobile) - Value: 00 + 66 + mobile

  const subTag00 = `0016A000000677010111`;
  const subTag01 = `011300${target}`;
  const tag29Val = subTag00 + subTag01;
  const tag29 = `29${tag29Val.length.toString().padStart(2, "0")}${tag29Val}`;

  const tag58 = `5802TH`; // Country
  const tag53 = `5303764`; // Currency THB
  const tag54 = `54${amt.length.toString().padStart(2, "0")}${amt}`; // Amount

  let data = `000201010212${tag29}${tag58}${tag53}${tag54}6304`; // 6304 is CRC tag

  data += crc16(data);
  return data;
}

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

  const [buyer, setBuyer] = useState(null); // 🆕
  const [seller, setSeller] = useState(null); // 🆕

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);

        if (res.ok && res.order) {
          setOrder(res.order);
          setBuyer(res.buyer);
          setSeller(res.seller);
        } else {
          // Fallback
          const ord = res.order || res;
          if (!ord?._id) setErr("ไม่พบคำสั่งซื้อ");
          else setOrder(ord);
        }
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
            <h1 className="text-2xl font-bold text-white">
              รายละเอียดคำสั่งซื้อ
            </h1>
            <p className="text-sm text-white/70">
              เลขคำสั่งซื้อ:
              <span className="font-mono ml-1 text-white">
                {formatOrderNumber(order?.orderNumber, isBuyer ? "buyer" : "seller") || order?._id}
              </span>
            </p>
          </div>

          <div className="flex gap-2 no-print">
            <Button onClick={() => handlePrint("a4")}>🖨 พิมพ์ A4</Button>
            <Button variant="ghost" onClick={() => handlePrint("80")}>
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
              <Card className="h2h-card">
                <div className="p-4 flex gap-3">
                  <img
                    src={itemImage}
                    alt={itemTitle}
                    className="w-28 h-28 rounded-xl object-cover border border-white/15"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <H2HLogo />
                      <span className="text-xs uppercase text-white/60">
                        H2H Thailand
                      </span>
                    </div>
                    <h2 className="font-semibold text-white truncate">
                      {itemTitle}
                    </h2>
                    <p className="text-sm text-white/70">
                      ผู้ซื้อ: <b className="text-white">{buyer?.name || buyer?.email || order.buyerId}</b>
                    </p>
                    <p className="text-sm text-white/70">
                      ผู้ขาย: <b className="text-white">{seller?.name || seller?.email || order.sellerId}</b>
                    </p>
                    <p className="text-xs text-white/50">
                      สร้างเมื่อ: {fmtDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="h2h-card">
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>สถานะ</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/20 text-xs">
                      {order.status} / {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">ยอดชำระ</span>
                    <span className="text-lg text-yellow-300">
                      ฿{Number(amount).toLocaleString("th-TH")}
                    </span>
                  </div>
                </div>
              </Card>
            </div>



            {/* ===== Payment ===== */}
            <Card className="h2h-card no-print">
              <div className="p-4 space-y-4">
                <h2 className="text-sm font-semibold text-white">
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

                {/* PromptPay QR Section */}
                {payMethod === "promptpay" && !isPaid && (
                  <div className="flex flex-col items-center p-4 bg-white rounded-lg space-y-2">
                    {seller?.phone ? (
                      <>
                        <h3 className="text-black font-bold text-sm">Scan to Pay</h3>
                        <ReceiptQRCode
                          value={generatePromptPayPayload(seller.phone, amount)}
                        />
                        <p className="text-black text-xs font-mono mt-2">{seller.phone}</p>
                        <p className="text-black text-lg font-bold">฿{Number(amount).toLocaleString("th-TH")}</p>
                        <p className="text-gray-500 text-xs text-center">
                          บัญชี: {seller.name}<br />
                          (พร้อมเพย์)
                        </p>
                      </>
                    ) : (
                      <div className="text-center text-red-500 text-sm">
                        <p>ไม่พบข้อมูลพร้อมเพย์ (เบอร์โทร) ของผู้ขาย</p>
                      </div>
                    )}
                  </div>
                )}

                {!isPaid && payMethod !== "promptpay" && (
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
                <b>{formatOrderNumber(order.orderNumber, isBuyer ? "buyer" : "seller") || order._id}</b>
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

            {/* ===== Payment Slip (หลักฐานการโอน) ===== */}
            <Card className="h2h-card no-print">
              <div className="p-4 space-y-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>📄 หลักฐานการโอนเงิน (Slip)</span>
                  {order.proofOfPayment && <span className="text-green-400 text-xs">✅ อัปโหลดแล้ว</span>}
                </h2>

                {order.proofOfPayment ? (
                  <div className="space-y-2">
                    <div className="relative group">
                      <img
                        src={order.proofOfPayment}
                        alt="Payment Slip"
                        className="w-full rounded-lg border border-white/20 shadow-md cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(order.proofOfPayment, "_blank")}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition">
                        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">🔍 กดเพื่อขยาย</span>
                      </div>
                    </div>

                    {isBuyer && (
                      <div className="flex gap-2 justify-end">
                        <label className="cursor-pointer px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs text-white flex items-center gap-1 transition border border-white/10">
                          ✏️ แก้ไข
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              try {
                                const formData = new FormData();
                                formData.append("images", file);
                                const token = localStorage.getItem("h2h_token");
                                const res = await fetch(`${API_BASE}/upload/images`, {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` },
                                  body: formData
                                });
                                const data = await res.json();
                                if (!data.ok) throw new Error(data.message || "Upload failed");
                                const slipUrl = data.files?.[0]?.url;
                                await api.patch(`/orders/${order._id}/slip`, { proofOfPayment: slipUrl });
                                window.location.reload();
                              } catch (err) {
                                console.error(err);
                                alert("อัปโหลดล้มเหลว: " + err.message);
                              }
                            }}
                          />
                        </label>
                        <button
                          onClick={async () => {
                            if (!confirm("ต้องการลบสลิปใช่ไหม?")) return;
                            try {
                              await api.patch(`/orders/${order._id}/slip`, { proofOfPayment: "" });
                              window.location.reload();
                            } catch (err) {
                              alert("ลบไม่สำเร็จ: " + err.message);
                            }
                          }}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-md text-xs flex items-center gap-1 transition border border-red-500/20"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-white/20 rounded-xl bg-white/5">
                    <p className="text-sm text-white/50 mb-3">ยังไม่มีหลักฐานการโอน</p>

                    {isBuyer && (
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition shadow-lg">
                        <span>📤 อัปโหลดสลิป</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            try {
                              const formData = new FormData();
                              formData.append("images", file);

                              const token = localStorage.getItem("h2h_token");
                              // ✅ Fixed Endpoint & Field
                              const res = await fetch(`${API_BASE}/upload/images`, {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` },
                                body: formData
                              });
                              const data = await res.json();
                              if (!data.ok) throw new Error(data.message || "Upload failed");

                              const slipUrl = data.files?.[0]?.url;
                              if (!slipUrl) throw new Error("No URL returned");

                              await api.patch(`/orders/${order._id}/slip`, { proofOfPayment: slipUrl });
                              window.location.reload();
                            } catch (err) {
                              console.error(err);
                              alert("อัปโหลดล้มเหลว: " + err.message);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* Seller Verification Actions */}
                {!isBuyer && order.paymentStatus === "pending_verification" && (
                  <div className="pt-4 border-t border-white/10 flex gap-2">
                    <button
                      onClick={async () => {
                        if (!confirm("ยืนยันยอดเงินถูกต้อง?")) return;
                        try {
                          await api.patch(`/orders/${order._id}/status`, {
                            paymentStatus: "paid",
                            status: "completed"
                          });
                          window.location.reload();
                        } catch (e) {
                          alert(e.message);
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-lg transition"
                    >
                      ✅ ยืนยันการชำระเงิน
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("ต้องการปฏิเสธยอดเงินนี้? (สถานะจะกลับเป็น Unpaid)")) return;
                        try {
                          await api.patch(`/orders/${order._id}/status`, {
                            paymentStatus: "unpaid",
                            status: "pending"
                          });
                          window.location.reload();
                        } catch (e) {
                          alert(e.message);
                        }
                      }}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg text-sm font-semibold transition"
                    >
                      ❌ ปฏิเสธ
                    </button>
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
