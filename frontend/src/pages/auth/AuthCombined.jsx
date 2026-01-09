// src/pages/auth/AuthCombined.jsx
import { useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import MainLayout from "../../layouts/MainLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { toast } from "react-hot-toast";

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
  const { login, register, googleLogin: authGoogleLogin } = useAuth();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await authGoogleLogin(tokenResponse.access_token);
        nav("/items");
      } catch (err) {
        console.error(err);
        toast.error("Google Login ไม่สำเร็จ");
      }
    },
    onError: () => toast.error("Google Login ไม่สำเร็จ"),
  });

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

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">หรือ</span>
                    </div>
                  </div>

                  <Button
                    variant="tonal"
                    className="w-full !bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50"
                    icon="google"
                    type="button"
                    onClick={() => handleGoogleLogin()}
                  >
                    ดำเนินการต่อด้วย Google
                  </Button>
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

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">หรือ</span>
                    </div>
                  </div>

                  <Button
                    variant="tonal"
                    className="w-full !bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50"
                    icon="google"
                    type="button"
                    onClick={() => handleGoogleLogin()}
                  >
                    สมัครด้วย Google
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
