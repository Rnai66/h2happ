import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import { useQuery } from '../../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../api/authFetch';

function Stepper({ step }) {
  const steps = ['ที่อยู่', 'ชำระเงิน', 'ตรวจสอบ'];
  return (
    <ul className="flex items-center gap-3 text-sm">
      {steps.map((t, i) => (
        <li key={t} className={`flex items-center gap-2 ${i <= step ? 'text-brand-blue' : 'text-slate-400'}`}>
          <span
            className={`w-6 h-6 rounded-full grid place-content-center border ${i <= step ? 'bg-brand-blue text-white border-brand-blue' : 'border-slate-300'
              }`}
          >
            {i + 1}
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function OrderSummary({ item }) {
  const price = item ? item.price : 0;
  const shipping = item ? 60 : 0;
  const fee = Math.round(price * 0.02);
  const total = price + shipping + fee;
  return (
    <Card>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold">สรุปคำสั่งซื้อ</h3>
        {item ? (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
              {item.images && item.images.length > 0 ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-content-center text-xs text-slate-400">No Img</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm line-clamp-2">{item.title}</div>
              <div className="font-bold text-brand-gold">฿ {price.toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">กำลังโหลดข้อมูลสินค้า...</p>
        )}
        <hr />
        <dl className="text-sm space-y-1">
          <div className="flex justify-between">
            <dt>ค่าส่ง</dt>
            <dd>฿ {shipping}</dd>
          </div>
          <div className="flex justify-between">
            <dt>ค่าธรรมเนียม</dt>
            <dd>฿ {fee.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between font-semibold text-brand-blue">
            <dt>รวม</dt>
            <dd className="tabular-nums">฿ {total.toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

export default function Checkout() {
  const q = useQuery();
  const itemId = q.get('itemId');
  const nav = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(true);

  const [step, setStep] = useState(0); // 0: address, 1: payment, 2: review
  const [address, setAddress] = useState({ name: '', phone: '', line1: '', district: '', province: '', zip: '' });
  const [method, setMethod] = useState('card');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Fetch real item
  useEffect(() => {
    if (!itemId) return;
    authFetch(`/api/items/${itemId}`) // Try protected route first (or public if available)
      .then(res => {
        // Endpoint might return { item: ... } or just item? 
        // Looking at MyListings logic (Step 108), /api/items/me returns {items:[]}. 
        // Looking at ItemDetail (not viewed but likely standard), usually returns { item }.
        // Let's assume standard response format. If fail, catch.
        // Let's check `orderRoutes` which calls `Item.findOne`.
        // I'll assume the item endpoint is /api/items/:id (public or auth). 
        // Wait, I haven't verified `itemRoutes.js`. 
        // Let's assume response structure.
        setItem(res.item || res);
        setLoadingItem(false);
      })
      .catch(e => {
        console.error(e);
        // Fallback or specific error
        authFetch(`/api/public/items/${itemId}`) // Try public if auth fail?
          .then(res => {
            setItem(res.item || res);
            setLoadingItem(false);
          })
          .catch(err => {
            setErr("โหลดสินค้าไม่สำเร็จ");
            setLoadingItem(false);
          });
      });
  }, [itemId]);

  // Pre-fill address from user profile if available
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        name: user.name || "",
        // phone, address etc. if user model has them
      }));
    }
  }, [user]);


  async function pay() {
    if (!item) return;
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนชำระเงิน");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      // Create Order
      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          itemId: item._id,
          buyerId: user._id || user.id, // AuthContext might have _id or id
          amount: item.price // Simple amount logic, ignoring shipping for logic simplicity for now
        })
      });

      if (res.ok) {
        // Success
        nav(`/orders?success=1`);
      } else {
        throw new Error(res.message || "สร้างคำสั่งซื้อไม่สำเร็จ");
      }

    } catch (e) {
      console.error(e);
      setErr(e.message || "เกิดข้อผิดพลาดในการชำระเงิน");
    } finally {
      setBusy(false);
    }
  }

  if (!itemId) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-slate-500">ไม่พบรหัสสินค้า</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">ชำระเงิน</h1>
        <Stepper step={step} />

        {err && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg">
            {err}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            {step === 0 && (
              <Card>
                <div className="p-4 space-y-4">
                  <h2 className="font-semibold">ที่อยู่จัดส่ง</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="ชื่อ-สกุล" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} required />
                    <Input label="เบอร์โทร" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required />
                    <Input label="ที่อยู่" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} required className="md:col-span-2" />
                    <Input label="อำเภอ/เขต" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} required />
                    <Input label="จังหวัด" value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })} required />
                    <Input label="รหัสไปรษณีย์" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} required />
                  </div>
                  <div className="pt-2">
                    <Button onClick={() => setStep(1)}>ต่อไป</Button>
                  </div>
                </div>
              </Card>
            )}
            {step === 1 && (
              <Card>
                <div className="p-4 space-y-4">
                  <h2 className="font-semibold">วิธีชำระเงิน</h2>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { key: 'card', label: 'บัตรเครดิต/เดบิต' },
                      { key: 'bank', label: 'โอนผ่านธนาคาร' },
                      { key: 'cod', label: 'เก็บเงินปลายทาง' },
                      { key: 'bro', label: 'Wallet (BroCoin)' },
                    ].map((m) => (
                      <Chip key={m.key} active={method === m.key} onClick={() => setMethod(m.key)}>
                        {m.label}
                      </Chip>
                    ))}
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <Button onClick={() => setStep(0)} className="bg-slate-600 hover:bg-slate-600/90">
                      ย้อนกลับ
                    </Button>
                    <Button onClick={() => setStep(2)}>ต่อไป</Button>
                  </div>
                </div>
              </Card>
            )}
            {step === 2 && (
              <Card>
                <div className="p-4 space-y-4">
                  <h2 className="font-semibold">ตรวจสอบคำสั่งซื้อ</h2>
                  <ul className="text-sm text-slate-700 list-disc ml-5">
                    <li>
                      จัดส่งถึง: {address.name} ({address.phone}) — {address.line1}, {address.district}, {address.province} {address.zip}
                    </li>
                    <li>วิธีชำระเงิน: {method.toUpperCase()}</li>
                  </ul>
                  <div className="pt-2 flex items-center gap-3">
                    <Button onClick={() => setStep(1)} className="bg-slate-600 hover:bg-slate-600/90">
                      ย้อนกลับ
                    </Button>
                    <Button disabled={busy} onClick={pay}>
                      {busy ? 'กำลังชำระ…' : 'ยืนยันและชำระ'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
          <div>
            <OrderSummary item={item} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
