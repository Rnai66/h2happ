import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';

export default function Login() {
  const loc = useLocation();
  const qp = new URLSearchParams(loc.search);
  const redirectTo = qp.get('redirectTo') || '/items';
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify(form) });
      window.location.assign(redirectTo);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4">เข้าสู่ระบบ</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label="อีเมล" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="รหัสผ่าน" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div className="flex justify-end">
            <Link to="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
              ลืมรหัสผ่าน?
            </Link>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</Button>
        </form>
      </div>
    </MainLayout>
  );
}
