import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { authFetch } from "../../api/authFetch";

const TABS = [
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "sold", label: "Sold" },
];

function formatTHB(n) {
  const num = Number(n || 0);
  return num.toLocaleString("th-TH");
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const base =
    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border";
  if (s === "draft") return <span className={`${base} bg-slate-50 border-slate-200 text-slate-700`}>Draft</span>;
  if (s === "active") return <span className={`${base} bg-emerald-50 border-emerald-100 text-emerald-700`}>Active</span>;
  if (s === "sold") return <span className={`${base} bg-amber-50 border-amber-100 text-amber-700`}>Sold</span>;
  if (s === "hidden") return <span className={`${base} bg-slate-50 border-slate-200 text-slate-600`}>Hidden</span>;
  if (s === "reserved") return <span className={`${base} bg-indigo-50 border-indigo-100 text-indigo-700`}>Reserved</span>;
  return <span className={`${base} bg-slate-50 border-slate-200 text-slate-600`}>{status || "-"}</span>;
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-2 text-sm rounded-full border whitespace-nowrap",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * Optimistic helpers
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function MyListings() {
  const nav = useNavigate();
  const [tab, setTab] = useState("draft");
  const [q, setQ] = useState("");
  const [lists, setLists] = useState({
    draft: [],
    active: [],
    sold: [],
  });

  const [counts, setCounts] = useState({ draft: 0, active: 0, sold: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const inflightRef = useRef(new Map()); // id -> previousSnapshot (for rollback)

  const currentItems = useMemo(() => {
    const items = lists[tab] || [];
    const kw = q.trim().toLowerCase();
    if (!kw) return items;
    return items.filter((it) => (it.title || "").toLowerCase().includes(kw));
  }, [lists, tab, q]);

  async function loadOne(statusKey, { silent = false } = {}) {
    if (!silent) {
      setErr("");
      setLoading(true);
    }
    try {
      const data = await authFetch(
        `/api/items/me?status=${encodeURIComponent(statusKey)}&limit=60`
      );
      const items = Array.isArray(data?.items) ? data.items : [];
      setLists((prev) => ({ ...prev, [statusKey]: items }));
      setCounts((prev) => ({ ...prev, [statusKey]: Number(data?.total ?? items.length) }));
    } catch (e) {
      if (e.status === 401) nav("/login");
      else setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadAll({ silent = false } = {}) {
    // โหลดครบทั้ง 3 แท็บเพื่อทำ counter + สลับแท็บเร็ว
    setErr("");
    if (!silent) setLoading(true);
    try {
      const [d, a, s] = await Promise.all([
        authFetch(`/api/items/me?status=draft&limit=60`),
        authFetch(`/api/items/me?status=active&limit=60`),
        authFetch(`/api/items/me?status=sold&limit=60`),
      ]);
      const draft = Array.isArray(d?.items) ? d.items : [];
      const active = Array.isArray(a?.items) ? a.items : [];
      const sold = Array.isArray(s?.items) ? s.items : [];
      setLists({ draft, active, sold });
      setCounts({
        draft: Number(d?.total ?? draft.length),
        active: Number(a?.total ?? active.length),
        sold: Number(s?.total ?? sold.length),
      });
    } catch (e) {
      if (e.status === 401) nav("/login");
      else setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moveItemOptimistic(itemId, from, to, patch = {}) {
    setLists((prev) => {
      const next = clone(prev);
      const fromList = next[from] || [];
      const idx = fromList.findIndex((x) => x._id === itemId);
      if (idx === -1) return prev;

      const item = { ...fromList[idx], ...patch };
      fromList.splice(idx, 1);
      next[from] = fromList;

      // insert top of target
      next[to] = [item, ...(next[to] || [])];

      return next;
    });

    setCounts((prev) => ({
      ...prev,
      [from]: Math.max(0, (prev[from] || 0) - 1),
      [to]: (prev[to] || 0) + 1,
    }));
  }

  function updateItemOptimistic(itemId, inTab, patch = {}) {
    setLists((prev) => {
      const next = clone(prev);
      next[inTab] = (next[inTab] || []).map((x) =>
        x._id === itemId ? { ...x, ...patch } : x
      );
      return next;
    });
  }

  function removeItemOptimistic(itemId, inTab) {
    setLists((prev) => {
      const next = clone(prev);
      const before = next[inTab] || [];
      next[inTab] = before.filter((x) => x._id !== itemId);
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [inTab]: Math.max(0, (prev[inTab] || 0) - 1),
    }));
  }

  async function patchStatus(item, nextStatus) {
    if (!item?._id) return;
    setErr("");

    const currentStatus = String(item.status || "").toLowerCase();
    const fromTab = currentStatus === "active" ? "active" : currentStatus === "sold" ? "sold" : "draft";
    const toTab = nextStatus === "active" ? "active" : nextStatus === "sold" ? "sold" : "draft";

    // snapshot for rollback
    inflightRef.current.set(item._id, { lists: clone(lists), counts: clone(counts) });

    // optimistic: move between tabs if needed
    if (fromTab !== toTab) moveItemOptimistic(item._id, fromTab, toTab, { status: nextStatus });
    else updateItemOptimistic(item._id, fromTab, { status: nextStatus });

    try {
      await authFetch(`/api/items/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      // refresh that tab silently to sync
      await loadAll({ silent: true });
    } catch (e) {
      // rollback
      const snap = inflightRef.current.get(item._id);
      if (snap) {
        setLists(snap.lists);
        setCounts(snap.counts);
      }
      setErr(e.message || "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      inflightRef.current.delete(item._id);
    }
  }

  async function softDelete(item) {
    if (!item?._id) return;
    const ok = window.confirm("ลบสินค้านี้แบบซ่อน (soft delete) ใช่ไหม?");
    if (!ok) return;

    setErr("");

    const currentStatus = String(item.status || "").toLowerCase();
    const inTab = currentStatus === "active" ? "active" : currentStatus === "sold" ? "sold" : "draft";

    inflightRef.current.set(item._id, { lists: clone(lists), counts: clone(counts) });

    // optimistic remove
    removeItemOptimistic(item._id, inTab);

    try {
      await authFetch(`/api/items/${item._id}`, { method: "DELETE" });
      await loadAll({ silent: true });
    } catch (e) {
      const snap = inflightRef.current.get(item._id);
      if (snap) {
        setLists(snap.lists);
        setCounts(snap.counts);
      }
      setErr(e.message || "ลบไม่สำเร็จ");
    } finally {
      inflightRef.current.delete(item._id);
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">สินค้าของฉัน</h1>
            <p className="text-xs text-slate-600">จัดการรายการขาย</p>
          </div>

          <Link
            to="/sell"
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
          >
            + ลงขาย
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label} <span className="ml-1 opacity-90">({counts[t.key] || 0})</span>
            </TabButton>
          ))}
        </div>

        {/* Search + refresh */}
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาในรายการของฉัน…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => loadAll()}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          >
            รีเฟรช
          </button>
        </div>

        {err && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {err}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-600">กำลังโหลด…</div>
        ) : currentItems.length === 0 ? (
          <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-4">
            ยังไม่มีสินค้าในแท็บนี้
          </div>
        ) : (
          <ul className="space-y-3">
            {currentItems.map((it) => {
              const status = String(it.status || "").toLowerCase();
              const isDraft = status === "draft";
              const isActive = status === "active";
              const isSold = status === "sold";

              return (
                <li
                  key={it._id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-xs text-slate-500 shrink-0">
                      {it.images?.[0] ? (
                        <img
                          src={it.images[0]}
                          alt="item"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "No image"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/items/${it._id}`}
                            className="font-semibold text-slate-900 line-clamp-2"
                          >
                            {it.title}
                          </Link>

                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-sm text-slate-700">
                              ฿ {formatTHB(it.price)}
                            </div>
                            <StatusBadge status={it.status} />
                          </div>

                          {it.description ? (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {it.description}
                            </div>
                          ) : null}
                        </div>

                        <button
                          onClick={() => softDelete(it)}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-700"
                        >
                          ลบ
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
  <Link
    to={`/sell?edit=${it._id}`}
    className="text-xs px-3 py-2 rounded-lg border border-slate-200"
  >
    Edit
  </Link>

  {isDraft && (
    <button
      onClick={() => patchStatus(it, "active")}
      className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white"
    >
      Publish
    </button>
  )}

  {isActive && (
    <>
      <button
        onClick={() => patchStatus(it, "sold")}
        className="text-xs px-3 py-2 rounded-lg border border-slate-200"
      >
        Mark Sold
      </button>
      <button
        onClick={() => patchStatus(it, "draft")}
        className="text-xs px-3 py-2 rounded-lg border border-slate-200"
      >
        Unpublish
      </button>
    </>
  )}

  {isSold && (
    <button
      onClick={() => patchStatus(it, "active")}
      className="text-xs px-3 py-2 rounded-lg border border-slate-200"
    >
      Relist
    </button>
  )}



                        {isActive && (
                          <>
                            <button
                              onClick={() => patchStatus(it, "sold")}
                              className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                            >
                              Mark Sold
                            </button>
                            <button
                              onClick={() => patchStatus(it, "draft")}
                              className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                            >
                              Unpublish
                            </button>
                          </>
                        )}

                        {isSold && (
                          <button
                            onClick={() => patchStatus(it, "active")}
                            className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                          >
                            Relist
                          </button>
                        )}

                        {/* optional: hidden/reserved support if backend supports */}
                        {(status === "hidden" || status === "reserved") && (
                          <button
                            onClick={() => patchStatus(it, "active")}
                            className="text-xs px-3 py-2 rounded-lg border border-slate-200"
                          >
                            Restore Active
                          </button>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-3">
                        updated: {new Date(it.updatedAt || it.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MainLayout>
  );
}
