// src/pages/auth/AuthCombined.jsx
import { useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

// 🔐 ใช้ AuthContext แทนเรียก api ตรง ๆ
import { useAuth } from "../../context/AuthContext";

export default function AuthCombined() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") === "register" ? "register" : "login";
  const setTab = (t) => {
    sp.set("tab", t);
    setSp(sp, { replace: true });
  };

  const nav = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();

  // --- Login state ---
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginErr, setLoginErr] = useState("");

  // --- Register state ---
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [regBusy, setRegBusy] = useState(false);
  const [regErr, setRegErr] = useState("");

  const strength = useMemo(() => {
    const p = regForm.password || "";
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [regForm.password]);

  // --- Submit: Login ---
  async function onLogin(e) {
    e.preventDefault();
    setLoginBusy(true);
    setLoginErr("");
    try {
      // ✅ ใช้ login() จาก AuthContext
      await login({
        email: loginForm.email,
        password: loginForm.password,
      });

      // login สำเร็จ → ย้ายไปหน้า items (ตาม flow เดิมคุณ)
      nav("/items");
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || "เข้าสู่ระบบไม่สำเร็จ";
      setLoginErr(String(msg));
    } finally {
      setLoginBusy(false);
    }
  }

  // --- Submit: Register ---
  async function onRegister(e) {
    e.preventDefault();
    setRegBusy(true);
    setRegErr("");
    try {
      // ✅ ใช้ register() จาก AuthContext
      // AuthContext จะไปจัดการ:
      //  - POST /auth/register
      //  - POST /token/reward (10 Tokens)
      //  - GET  /profile/me
      await register({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        phone: regForm.phone, // ถ้า backend ยังไม่รองรับ phone ก็จะ ignore ไป
      });

      // สมัครเสร็จ + ได้ token แล้ว → ไปหน้า items
      nav("/items");
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || e?.message || "สมัครสมาชิกไม่สำเร็จ";
      setRegErr(String(msg));
    } finally {
      setRegBusy(false);
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ฝั่งภาพ / แบรนด์ */}
        <section className="hidden md:block">
          <div className="rounded-2xl overflow-hidden shadow bg-white">
            <img
              src="https://picsum.photos/seed/h2h-auth/960/960"
              alt="H2H Thailand"
              className="w-full aspect-square object-cover"
            />
          </div>
          <div className="mt-4 text-slate-600 text-sm leading-relaxed">
            <p className="font-semibold text-slate-900">
              H2H Thailand — Blue×Gold
            </p>
            <p>ชุมชนซื้อ-ขายอย่างปลอดภัย UI สวย ใช้ง่ายทุกอุปกรณ์</p>
          </div>
        </section>

        {/* ฝั่งฟอร์ม */}
        <section>
          <div className="bg-white rounded-2xl shadow">
            {/* Tabs */}
            <div className="grid grid-cols-2">
              <button
                onClick={() => setTab("login")}
                className={`py-3 text-center text-sm font-medium rounded-tl-2xl ${tab === "login"
                  ? "bg-brand-blue text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => setTab("register")}
                className={`py-3 text-center text-sm font-medium rounded-tr-2xl ${tab === "register"
                  ? "bg-brand-blue text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                สมัครสมาชิก
              </button>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6">
              {/* LOGIN */}
              {tab === "login" && (
                <form className="space-y-4" onSubmit={onLogin}>
                  <Input
                    label="อีเมล"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="รหัสผ่าน"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    required
                  />
                  {loginErr && (
                    <p className="text-sm text-red-600">{loginErr}</p>
                  )}
                  <Button disabled={loginBusy} className="w-full">
                    {loginBusy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
                  </Button>

                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await loginWithGoogle();
                        nav("/items");
                      } catch (e) {
                        setLoginErr("Google Login failed: " + e.message);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-slate-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    เข้าสู่ระบบด้วย Google
                  </button>

                  <p className="text-sm text-slate-600 text-center">
                    ยังไม่มีบัญชี?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("register")}
                      className="text-brand-blue underline"
                    >
                      สมัครสมาชิก
                    </button>
                  </p>
                </form>
              )}

              {/* REGISTER */}
              {tab === "register" && (
                <form className="space-y-4" onSubmit={onRegister}>
                  <Input
                    label="ชื่อ"
                    value={regForm.name}
                    onChange={(e) =>
                      setRegForm({ ...regForm, name: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="อีเมล"
                    type="email"
                    value={regForm.email}
                    onChange={(e) =>
                      setRegForm({ ...regForm, email: e.target.value })
                    }
                    required
                  />
                  <div>
                    <Input
                      label="รหัสผ่าน"
                      type="password"
                      value={regForm.password}
                      onChange={(e) =>
                        setRegForm({ ...regForm, password: e.target.value })
                      }
                      required
                    />
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${["w-1/4", "w-2/4", "w-3/4", "w-full"][strength - 1] ||
                          "w-0"
                          } bg-brand-blue transition`}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      อย่างน้อย 8 ตัวอักษร รวมตัวเลข/ตัวใหญ่/สัญลักษณ์
                    </p>
                  </div>
                  <Input
                    label="เบอร์โทร"
                    value={regForm.phone}
                    onChange={(e) =>
                      setRegForm({ ...regForm, phone: e.target.value })
                    }
                    required
                  />

                  {regErr && (
                    <p className="text-sm text-red-600">{regErr}</p>
                  )}

                  <Button disabled={regBusy} className="w-full">
                    {regBusy ? "กำลังสร้าง…" : "สมัครสมาชิก"}
                  </Button>
                  <p className="text-sm text-slate-600 text-center">
                    มีบัญชีแล้ว?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("login")}
                      className="text-brand-blue underline"
                    >
                      เข้าสู่ระบบ
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 text-center">
            การใช้งานระบบถือว่ายอมรับ{" "}
            <Link to="/terms" className="underline">
              ข้อตกลงการใช้บริการ
            </Link>{" "}
            และ{" "}
            <Link to="/privacy" className="underline">
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
