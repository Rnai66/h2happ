import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';

export default function ResetPassword() {
    const loc = useLocation();
    const nav = useNavigate();
    const qp = new URLSearchParams(loc.search);
    const token = qp.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!token) {
            setErr('ไม่พบ Token รีเซ็ตรหัสผ่าน');
        }
    }, [token]);

    async function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setMsg('');
        setErr('');

        if (password !== confirmPassword) {
            setErr('รหัสผ่านไม่ตรงกัน');
            setBusy(false);
            return;
        }

        try {
            const res = await api('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, password }),
            });
            setMsg(res.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
            setTimeout(() => {
                nav('/auth?tab=login');
            }, 2000);
        } catch (e) {
            setErr(String(e.message || e));
        } finally {
            setBusy(false);
        }
    }

    if (!token) {
        return (
            <MainLayout>
                <div className="max-w-md mx-auto pt-10 px-4 text-center">
                    <p className="text-red-600">ลิงก์ไม่ถูกต้อง หรือหมดอายุ</p>
                    <Link to="/auth/forgot-password" className="text-blue-600 underline mt-4 block">
                        ขอรีเซ็ตใหม่
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-md mx-auto pt-10 px-4">
                <h1 className="text-2xl font-semibold mb-4">ตั้งรหัสผ่านใหม่</h1>

                {msg ? (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-200">
                        {msg}
                        <p className="text-sm mt-2">กำลังพาไปหน้าเข้าสู่ระบบ...</p>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <Input
                            label="รหัสผ่านใหม่"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <Input
                            label="ยืนยันรหัสผ่านใหม่"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        {err && <p className="text-sm text-red-600">{err}</p>}

                        <Button disabled={busy} className="w-full">
                            {busy ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                        </Button>
                    </form>
                )}
            </div>
        </MainLayout>
    );
}
