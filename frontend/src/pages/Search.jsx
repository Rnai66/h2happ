import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { api } from "../lib/api";

/* ===== helpers ===== */
function googleSearchUrl(q) {
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=th&gl=th`;
}
function googlePriceUrl(q) {
  return `https://www.google.com/search?q=${encodeURIComponent(q + " ราคา")}&hl=th&gl=th`;
}
function googleMapUrl(q) {
  return `https://www.google.com/maps/search/${encodeURIComponent(q)}`;
}
function thb(n) {
  return "฿" + Number(n || 0).toLocaleString("th-TH");
}
function median(values = []) {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2);
}

/* ===== page ===== */
export default function Search() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim();

  const [tab, setTab] = useState("h2h"); // "h2h" | "google" | "ai"

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // LLM state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [aiLLM, setAiLLM] = useState(null);

  /* ================= load items (SAFE MODE) ================= */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await api.get("/items?page=1&limit=100&status=active");
        const list = Array.isArray(res) ? res : Array.isArray(res.items) ? res.items : [];
        setItems(list);
      } catch (e) {
        setErr(e.message || "โหลดรายการสินค้าไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ================= filter frontend ================= */
  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((it) =>
      [it.title, it.description, it.category, it.location, it.sellerName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  /* ================= AI (rule-based) ================= */
  const prices = useMemo(() => filtered.map((i) => i.price).filter((p) => p > 0), [filtered]);

  const avgPrice = useMemo(() => {
    if (!prices.length) return 0;
    return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  }, [prices]);

  const midPrice = useMemo(() => median(prices), [prices]);

  const aiRule = useMemo(() => {
    if (!avgPrice || !midPrice) return null;
    const diffPct = Math.round(((avgPrice - midPrice) / midPrice) * 100);

    if (diffPct <= -15) {
      return {
        level: "good",
        text: "ราคาถูกกว่าตลาดชัดเจน เหมาะสำหรับซื้อทันที",
        suggest: Math.round(midPrice * 0.95),
        diffPct,
      };
    }
    if (diffPct <= 5) {
      return {
        level: "fair",
        text: "ราคาใกล้เคียงตลาด ถือว่าสมเหตุสมผล",
        suggest: midPrice,
        diffPct,
      };
    }
    return {
      level: "bad",
      text: "ราคาสูงกว่าตลาด แนะนำต่อรองหรือเปรียบเทียบเพิ่มเติม",
      suggest: Math.round(midPrice * 0.9),
      diffPct,
    };
  }, [avgPrice, midPrice]);

  async function runLLMAdvice() {
    try {
      setAiLoading(true);
      setAiErr("");
      setAiLLM(null);

      // ส่งสถิติ + ตัวอย่างรายการ (ไม่ส่งรูป/ข้อมูลส่วนตัว)
      const sample = filtered.slice(0, 12).map((it) => ({
        title: it.title,
        price: it.price,
        location: it.location || "",
        condition: it.condition || "",
        category: it.category || "",
      }));

      const payload = {
        query,
        stats: {
          count: filtered.length,
          avgPrice,
          medianPrice: midPrice,
          minPrice: prices.length ? Math.min(...prices) : 0,
          maxPrice: prices.length ? Math.max(...prices) : 0,
        },
        sampleItems: sample,
      };

      const res = await api.post("/ai/price-advice", payload);

      // res = { ok:true, advice:{...} }
      if (!res?.ok) throw new Error(res?.message || "AI วิเคราะห์ไม่สำเร็จ");
      setAiLLM(res.advice);
    } catch (e) {
      setAiErr(e.message || "AI วิเคราะห์ไม่สำเร็จ");
    } finally {
      setAiLoading(false);
    }
  }

  /* ================= UI bits ================= */
  const TabButton = ({ id, children }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={[
        "px-3 py-2 rounded-xl text-sm border",
        tab === id
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-black/30 text-white/70 border-white/15 hover:bg-black/40",
      ].join(" ")}
    >
      {children}
    </button>
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-5">

        {/* ===== Header ===== */}
        <div>
          <h1 className="text-2xl font-bold text-white">🔍 Search</h1>
          <p className="text-sm text-white/70">
            คำค้นหา: <b className="text-white">{query || "-"}</b>
          </p>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex gap-2 flex-wrap">
          <TabButton id="h2h">H2H</TabButton>
          <TabButton id="google">Google</TabButton>
          <TabButton id="ai">AI</TabButton>
        </div>

        {/* ===== Status ===== */}
        {loading && <p className="text-white/70">กำลังโหลด...</p>}
        {err && <p className="text-red-300">{err}</p>}

        {/* ================= TAB: H2H ================= */}
        {tab === "h2h" && (
          <>
            {!loading && query && filtered.length === 0 && (
              <p className="text-white/60">ไม่พบสินค้าที่ตรงกับคำค้น</p>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((it) => (
                <Card
                  key={it._id}
                  className="h2h-card cursor-pointer"
                  onClick={() => nav(`/items/${it._id}`)}
                >
                  <div className="p-4 space-y-2">
                    <img
                      src={it.images?.[0] || "https://placehold.co/400x300?text=H2H"}
                      alt={it.title}
                      className="w-full h-40 object-cover rounded-lg border border-white/15"
                    />
                    <div className="font-semibold text-white truncate">{it.title}</div>
                    <div className="text-yellow-300 font-bold">{thb(it.price)}</div>
                    <div className="text-xs text-white/60 truncate">{it.location || "—"}</div>
                  </div>
                </Card>
              ))}
            </div>

            {query && filtered.length > 0 && (
              <div className="text-xs text-white/50">
                * ค้นหาจากสินค้าที่มีอยู่ในระบบ H2H (Safe Mode)
              </div>
            )}
          </>
        )}

        {/* ================= TAB: Google ================= */}
        {tab === "google" && (
          <>
            {!query ? (
              <p className="text-white/60">ใส่คำค้นใน URL เช่น /search?q=ข้าว</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h2h-card p-4">
                  <h3 className="text-sm font-semibold text-white mb-1">🔎 ราคาอ้างอิงจาก Google</h3>
                  <p className="text-xs text-white/60 mb-2">
                    เปิดดูราคาตลาดภายนอกเพื่อเปรียบเทียบ (ปลอดภัย ไม่ scrape)
                  </p>
                  <a
                    href={googlePriceUrl(query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 text-sm hover:underline"
                  >
                    👉 ดูผลการค้นหา “{query} ราคา”
                  </a>

                  <div className="mt-3 text-xs text-white/50">
                    Tip: คัดลอกราคาเฉลี่ยจากเว็บภายนอก แล้วเทียบกับ H2H ในแท็บ AI
                  </div>
                </div>

                <div className="h2h-card p-4">
                  <h3 className="text-sm font-semibold text-white mb-1">📍 พิกัด / พื้นที่จาก Google Maps</h3>
                  <p className="text-xs text-white/60 mb-2">
                    ดูตำแหน่งร้านหรือพื้นที่จำหน่าย (เปิดแท็บใหม่)
                  </p>
                  <a
                    href={googleMapUrl(query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 text-sm hover:underline"
                  >
                    👉 ค้นหา “{query}” บน Google Maps
                  </a>
                </div>

                <div className="h2h-card p-4 md:col-span-2">
                  <h3 className="text-sm font-semibold text-white mb-2">🔗 ลิงก์ค้นหาเพิ่มเติม</h3>
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="text-blue-300 text-sm hover:underline"
                      href={googleSearchUrl(`${query} มือสอง ราคา`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      มือสอง ราคา
                    </a>
                    <a
                      className="text-blue-300 text-sm hover:underline"
                      href={googleSearchUrl(`${query} รีวิว`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      รีวิว
                    </a>
                    <a
                      className="text-blue-300 text-sm hover:underline"
                      href={googleSearchUrl(`${query} ใกล้ฉัน`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ใกล้ฉัน
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= TAB: AI ================= */}
        {tab === "ai" && (
          <>
            {!query ? (
              <p className="text-white/60">ใส่คำค้นใน URL เช่น /search?q=ข้าว</p>
            ) : (
              <div className="space-y-4">
                {/* Rule-based */}
                {aiRule ? (
                  <div className="h2h-card p-4">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      🤖 AI แนะนำราคา (Rule-based จากข้อมูล H2H)
                    </h3>
                    <p
                      className={`text-sm ${
                        aiRule.level === "good"
                          ? "text-emerald-300"
                          : aiRule.level === "fair"
                          ? "text-yellow-300"
                          : "text-red-300"
                      }`}
                    >
                      {aiRule.text}
                    </p>

                    <div className="mt-2 text-xs text-white/70 space-y-1">
                      <div>จำนวนผลลัพธ์: <b className="text-white">{filtered.length}</b></div>
                      <div>ราคาเฉลี่ย: <b className="text-white">{thb(avgPrice)}</b></div>
                      <div>ราคากลาง: <b className="text-white">{thb(midPrice)}</b></div>
                      <div>
                        แนะนำตั้งราคาใกล้:{" "}
                        <b className="text-yellow-300">{thb(aiRule.suggest)}</b>
                      </div>
                      <div className="text-white/50">
                        สัญญาณราคา: {aiRule.diffPct < 0 ? `ถูกกว่า ~${Math.abs(aiRule.diffPct)}%` : `แพงกว่า ~${aiRule.diffPct}%`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h2h-card p-4">
                    <p className="text-sm text-white/70">
                      ยังไม่พอข้อมูลสำหรับวิเคราะห์ (ลองค้นหาคำอื่น หรือให้มีผลลัพธ์มากขึ้น)
                    </p>
                  </div>
                )}

                {/* LLM */}
                <div className="h2h-card p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">
                        🧠 AI แนะนำราคา (LLM – ผ่าน Backend)
                      </h3>
                      <p className="text-xs text-white/60">
                        ใช้ LLM วิเคราะห์จากสถิติ + ตัวอย่างผลลัพธ์ (ไม่ส่งข้อมูลส่วนตัว)
                      </p>
                    </div>

                    <Button onClick={runLLMAdvice} disabled={aiLoading || !query}>
                      {aiLoading ? "กำลังวิเคราะห์..." : "ให้ AI วิเคราะห์จริง"}
                    </Button>
                  </div>

                  {aiErr && <p className="mt-2 text-sm text-red-300">{aiErr}</p>}

                  {aiLLM && (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="text-white">
                        <b className="text-yellow-300">ข้อสรุป:</b> {aiLLM.summary}
                      </div>
                      <div className="text-white/80">
                        <b className="text-yellow-300">ราคาแนะนำ:</b>{" "}
                        {aiLLM.suggestedPrice ? thb(aiLLM.suggestedPrice) : "—"}
                      </div>
                      {Array.isArray(aiLLM.bullets) && aiLLM.bullets.length > 0 && (
                        <ul className="list-disc pl-5 text-white/80 space-y-1">
                          {aiLLM.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                      {aiLLM.risks && (
                        <div className="text-white/70 text-xs">
                          <b className="text-yellow-300">ข้อควรระวัง:</b> {aiLLM.risks}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-white/50">
                    หมายเหตุ: ถ้ายังไม่ได้ตั้งค่า API key / route backend จะขึ้น error — ดูไฟล์ backend ด้านล่าง
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </MainLayout>
  );
}
