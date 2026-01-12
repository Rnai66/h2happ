import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';

export default function ForgotPassword() {
    const [identifier, setIdentifier] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    async function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setMsg('');
        setErr('');
        try {
            // Send as 'email' key if users expects consistent API, OR change API to accept 'identifier'
            // Based on my backend edit, I check both 'email' and 'phone' from body, or just use one common field.
            // Backend code: const { email, phone } = req.body; const identifier = email || phone;
            // So I can send { email: identifier } and it will work.
            const res = await api('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: identifier }),
            });
            setMsg(res.message || 'หากข้อมูลถูกต้อง ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว');
        } catch (e) {
            setErr(String(e.message || e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <MainLayout>
            <div className="max-w-md mx-auto pt-10 px-4">
                <h1 className="text-2xl font-semibold mb-2">ลืมรหัสผ่าน?</h1>
                <p className="text-gray-600 mb-6 text-sm">
                    กรอกอีเมลหรือเบอร์โทรศัพท์ของคุณเพื่อรับลิงก์สำหรับตั้งค่ารหัสผ่านใหม่
                </p>

                {msg ? (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-200">
                        {msg}
                        <div className="mt-4">
                            <Link to="/auth?tab=login" className="text-emerald-800 underline font-medium">กลับไปหน้าเข้าสู่ระบบ</Link>
                        </div>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <Input
                            label="อีเมลหรือเบอร์โทรศัพท์"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            placeholder="name@example.com หรือ 0812345678"
                        />
                        {err && <p className="text-sm text-red-600">{err}</p>}

                        <Button disabled={busy} className="w-full">
                            {busy ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
                        </Button>

                        <div className="text-center mt-4">
                            <Link to="/auth?tab=login" className="text-sm text-blue-600 hover:underline">
                                กลับไปหน้าเข้าสู่ระบบ
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </MainLayout>
    );
}
