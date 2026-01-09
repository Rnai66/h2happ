import { useState, useEffect } from "react";
import {
  H2HCard,
  H2HButton,
  H2HTag,
  H2HSkeleton
} from "../ui";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { authFetch } from "../api/authFetch";
import { formatOrderNumber } from "../utils/formatOrderNumber";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    items: 0,
    payments: 0,
    revenue: 0,
    expenses: 0,
    chartData: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  // Mock API data (สามารถเชื่อมต่อ backend ทีหลังได้)
  const mockStats = {
    users: 128,
    items: 342,
    payments: 97,
    revenue: 12500,
    chartData: [
      { name: "Mon", sales: 20 },
      { name: "Tue", sales: 35 },
      { name: "Wed", sales: 50 },
      { name: "Thu", sales: 40 },
      { name: "Fri", sales: 65 },
      { name: "Sat", sales: 55 },
      { name: "Sun", sales: 30 },
    ],
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await authFetch("/api/dashboard/stats");
        setStats({
          users: data.items.active, // Map Active Items to first card
          items: data.items.sold,   // Map Sold Items to second card
          payments: data.salesCount + data.purchasesCount, // Total Transactions
          revenue: data.revenue,     // Total Income
          expenses: data.expenses,   // Total Expense
          chartData: data.chartData || [], // ✅ Use Real Backend Data
          recentTransactions: data.recentTransactions || [],
        });
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="section page-fade">
      {/* ================= Header ================= */}
      <div className="mb-6">
        <h1 className="title-glow mb-1">H2H Dashboard</h1>
        <p className="subtitle text-[var(--fg-muted)]">
          ภาพรวมการทำงานของระบบ H2H Thailand (Digital Silk UI)
        </p>
      </div>

      {/* ================= Top Stats Cards ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {loading ? (
          <>
            <H2HSkeleton height="120px" />
            <H2HSkeleton height="120px" />
            <H2HSkeleton height="120px" />
            <H2HSkeleton height="120px" />
          </>
        ) : (
          <>
            <StatCard label="Active Listings" value={stats.users} color="purple" icon="inventory_2" />
            <StatCard label="Sold Items" value={stats.items} color="emerald" icon="check_circle" />
            <StatCard label="Expenses (Buy)" value={`฿${stats.expenses.toLocaleString()}`} color="rose" icon="shopping_bag" />
            <StatCard
              label="Income (Sell)"
              value={`฿${stats.revenue.toLocaleString()}`}
              color="amber"
              icon="monetization_on"
            />
          </>
        )}
      </div>

      {/* ================= Chart Section ================= */}
      <H2HCard className="p-6 shadow-lg bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-md">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="material-icons-round text-blue-400">equalizer</span>
          Weekly Sales Overview
        </h2>
        {loading ? (
          <H2HSkeleton height="220px" />
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={stats.chartData}>
                <XAxis dataKey="name" stroke="var(--fg-muted)" tick={{ fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    background: "rgba(20, 20, 30, 0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    color: "#fff"
                  }}
                  formatter={(value) => `฿${value.toLocaleString()}`}
                />
                <Legend iconType="circle" />
                <Bar dataKey="income" name="Income (Sell)" fill="url(#incomeGradient)" radius={[6, 6, 6, 6]} barSize={12} />
                <Bar dataKey="expense" name="Expense (Buy)" fill="url(#expenseGradient)" radius={[6, 6, 6, 6]} barSize={12} />
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </H2HCard>

      {/* ================= Recent Transactions Table ================= */}
      <H2HCard className="mt-6 p-6 shadow-lg overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-gradient-to-b dark:from-white/5 dark:to-transparent">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="material-icons-round text-emerald-400">history</span>
          Recent Transactions
        </h2>
        {loading ? (
          <div className="space-y-2">
            <H2HSkeleton height="40px" />
            <H2HSkeleton height="40px" />
            <H2HSkeleton height="40px" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 dark:text-[var(--fg-muted)] border-b border-slate-200 dark:border-white/5 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Order ID</th>
                  <th className="py-3 px-4 font-medium">Item</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-[var(--fg-muted)] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:opacity-70">{formatOrderNumber(tx.orderNumber, "seller")}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">{tx.itemSnapshot?.title || "Unknown Item"}</td>
                      <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                        ฿{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${tx.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : tx.status === "pending"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-[var(--fg-muted)] italic">
                      No recent transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </H2HCard>

      {/* ================= Action Buttons ================= */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-fade { animation: none !important; }
          .section { padding: 0 !important; }
        }
      `}</style>
      <div className="mt-6 flex justify-end gap-3 no-print">
        <H2HButton variant="gold" onClick={() => window.print()} className="shadow-lg shadow-amber-500/20">
          <span className="material-icons-round text-base">print</span>
          Print Report
        </H2HButton>

        <H2HButton variant="ghost" onClick={() => window.location.reload()} className="hover:bg-white/5">
          <span className="material-icons-round text-base">refresh</span>
          Refresh
        </H2HButton>
      </div>
    </div>
  );
}

/* ============================
   Subcomponent: StatCard
   ============================ */
function StatCard({ label, value, color = "blue", icon }) {
  const themes = {
    purple: "from-violet-500 to-fuchsia-600 shadow-fuchsia-500/20",
    emerald: "from-emerald-400 to-teal-600 shadow-emerald-500/20",
    rose: "from-rose-400 to-red-600 shadow-rose-500/20",
    amber: "from-amber-300 to-orange-500 shadow-orange-500/20",
    blue: "from-blue-400 to-indigo-600 shadow-blue-500/20",
  };

  const bgGradient = themes[color] || themes.blue;

  return (
    <div
      className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${bgGradient} text-white shadow-lg transform transition-all hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <span className="material-icons-round text-6xl">{icon}</span>
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 mb-2 opacity-90">
          <span className="material-icons-round text-lg bg-white/20 p-1 rounded-full">{icon}</span>
          <h3 className="text-xs font-bold uppercase tracking-wider">{label}</h3>
        </div>
        <p className="text-3xl font-extrabold tracking-tight drop-shadow-md">{value}</p>
      </div>
    </div>
  );
}
