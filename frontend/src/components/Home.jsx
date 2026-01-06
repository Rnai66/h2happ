import MobileShell from "../layouts/MobileShell";
import Button from "../components/ui/Button";

export default function Home() {
  return (
    <MobileShell title="Home">
      <div className="mt-2 space-y-3">
        <div className="h2h-card rounded-3xl p-4">
          <div className="text-[11px] text-white/60">Blue×Gold</div>
          <div className="text-xl font-bold leading-tight mt-1">
            ซื้อ-ขายง่าย <span className="text-white/80">แบบ Carousell</span>
            <br/>แต่มีระบบ <span className="text-white">Token</span>
          </div>
          <div className="text-sm text-white/65 mt-2 leading-relaxed">
            เดโม่นี้โฟกัส Mobile-first UI: ค้นหาไว, การ์ดสวย, กดง่าย,
            พร้อมต่อระบบสมัคร/รับ 10 เหรียญ และอัปโหลดรูป
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={() => (location.href = "/listings")}>ดูสินค้า</Button>
            <Button variant="ghost" onClick={() => (location.href = "/me")}>โปรไฟล์</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h2h-card rounded-2xl p-4">
            <div className="text-sm font-semibold">⚡ โหลดไว</div>
            <div className="text-xs text-white/60 mt-1">Mobile-first + Card UI</div>
          </div>
          <div className="h2h-card rounded-2xl p-4">
            <div className="text-sm font-semibold">🔒 ปลอดภัย</div>
            <div className="text-xs text-white/60 mt-1">JWT + Role seller/buyer</div>
          </div>
          <div className="h2h-card rounded-2xl p-4">
            <div className="text-sm font-semibold">🖼️ รูปสินค้า</div>
            <div className="text-xs text-white/60 mt-1">พร้อมต่อ Cloudinary/S3</div>
          </div>
          <div className="h2h-card rounded-2xl p-4">
            <div className="text-sm font-semibold">🪙 Token</div>
            <div className="text-xs text-white/60 mt-1">สมัครรับฟรี 10 เหรียญ</div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
