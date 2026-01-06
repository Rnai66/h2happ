// frontend/src/pages/sell/Sell.jsx
import { useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Chip from "../../components/ui/Chip";

// ปุ่มชุดล่างของฟอร์ม
function SellActions({ busy }) {
  return (
    <div className="flex gap-3 mt-2">
      <Button icon="back" variant="ghost" type="button">ย้อนกลับ</Button>
      <Button icon="sell" variant="solid" type="submit" disabled={busy} className="flex-1">
        {busy ? "กำลังโพสต์…" : "โพสต์ประกาศ"}
      </Button>
    </div>
  );
}

export default function Sell(){
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "มือถือ",
    condition: "เหมือนใหม่",
    location: "",
    description: "",
    images: []
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function onImages(e){
    const files = Array.from(e.target.files || []);
    setForm(prev => ({ ...prev, images: files }));
  }

  async function onSubmit(e){
    e.preventDefault();
    setBusy(true);
    // TODO: call real API with FormData
    await new Promise(r=>setTimeout(r, 600));
    setBusy(false);
    setDone(true);
    setTimeout(()=> setDone(false), 2000);
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">ลงประกาศขาย</h1>
        <Card>
          <form className="p-5 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="ชื่อสินค้า"
                value={form.title}
                onChange={e=>setForm({...form, title: e.target.value})}
                required
              />
              <Input
                label="ราคา (บาท)"
                type="number"
                inputMode="numeric"
                value={form.price}
                onChange={e=>setForm({...form, price: e.target.value})}
                required
              />

              <div>
                <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                <div className="flex flex-wrap gap-2">
                  {["มือถือ","คอมพิวเตอร์","กล้อง","แฟชั่น","กีฬา","อื่นๆ"].map(c=>(
                    <Chip key={c} active={form.category===c} onClick={()=>setForm({...form, category:c})}>{c}</Chip>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">สภาพ</label>
                <div className="flex flex-wrap gap-2">
                  {["ใหม่","เหมือนใหม่","ดี","พอใช้"].map(c=>(
                    <Chip key={c} active={form.condition===c} onClick={()=>setForm({...form, condition:c})}>{c}</Chip>
                  ))}
                </div>
              </div>

              <Input
                label="ทำเล/นัดรับ"
                value={form.location}
                onChange={e=>setForm({...form, location: e.target.value})}
                required
                className="md:col-span-2"
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={e=>setForm({...form, description: e.target.value})}
                  className="h2h-input min-h-[120px]"
                  placeholder="เล่ารายละเอียดสินค้า จุดเด่น ข้อสังเกต"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">รูปภาพสินค้า</label>
                <input type="file" multiple accept="image/*" onChange={onImages} className="block w-full text-sm"/>
                {form.images.length>0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                    {form.images.map((f,i)=> (
                      <div key={i} className="aspect-square bg-slate-100 rounded-xl grid place-items-center text-xs text-slate-500">
                        {f.name.slice(0,18)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ปุ่มดำเนินการ */}
            <SellActions busy={busy} />

            {done && <p className="text-emerald-600 text-sm mt-2 text-center">บันทึกประกาศเรียบร้อย!</p>}
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
