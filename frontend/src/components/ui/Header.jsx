// src/components/ui/Header.jsx
import Icon from "./Icon";
import Button from "./Button";

export default function Header() {
  return (
    <header className="h2h-header border-slate-200/80 shadow-silk px-4 py-3 flex items-center justify-between">
      {/* โลโก้ / ชื่อแอป */}
      <div className="flex items-center gap-2">
        <Icon name="home" size={22} className="text-blue-600" />
        <h1 className="font-semibold text-lg text-slate-900">H2H Thailand</h1>
      </div>

      {/* ปุ่มลงขาย */}
      <div className="hidden sm:block">
        <Button icon="sell">ลงขาย</Button>
      </div>

      {/* ไอคอนเมนู (เฉพาะมือถือ) */}
      <div className="sm:hidden flex items-center gap-3 text-slate-700">
        <Icon name="chat" />
        <Icon name="profile" />
      </div>
    </header>
  );
}
