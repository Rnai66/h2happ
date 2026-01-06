import { useMemo, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const strength = useMemo(() => {
    const p = form.password || '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [form.password]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      window.location.assign('/items');
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4">สร้างบัญชี</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label="ชื่อ" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="อีเมล" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <div>
            <Input label="รหัสผ่าน" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full ${['w-1/4','w-2/4','w-3/4','w-full'][strength-1] || 'w-0'} bg-brand-blue transition`}></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">อย่างน้อย 8 ตัวอักษร รวมตัวเลข/ตัวใหญ่/สัญลักษณ์</p>
          </div>
          <Input label="เบอร์โทร" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <div className="flex items-center gap-2 text-sm">
            <input type="checkbox" required /> <span>ยอมรับเงื่อนไขการใช้งาน</span>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button disabled={busy}>{busy ? 'กำลังสร้าง…' : 'สร้างบัญชี'}</Button>
        </form>
      </div>
    </MainLayout>
  );
}
