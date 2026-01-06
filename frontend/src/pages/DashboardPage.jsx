import { useState, useEffect } from "react";
import {
  H2HCard,
  H2HButton,
  H2HTag,
  H2HSkeleton
} from "../ui";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
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
    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1200);
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
            <StatCard label="Users" value={stats.users} color="blue" />
            <StatCard label="Items" value={stats.items} color="gold" />
            <StatCard label="Payments" value={stats.payments} color="blue" />
            <StatCard
              label="Revenue"
              value={`฿${stats.revenue.toLocaleString()}`}
              color="gold"
            />
          </>
        )}
      </div>

      {/* ================= Chart Section ================= */}
      <H2HCard className="p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Weekly Sales Overview</h2>
        {loading ? (
          <H2HSkeleton height="220px" />
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={stats.chartData}>
                <XAxis dataKey="name" stroke="var(--fg-muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    backdropFilter: "blur(10px)",
                  }}
                />
                <Bar dataKey="sales" fill="url(#h2hGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="h2hGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f2c14e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#5fa2f8" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </H2HCard>

      {/* ================= Action Buttons ================= */}
      <div className="mt-6 flex justify-end gap-3">
        <H2HButton variant="gold" onClick={() => alert("Generating report...")}>
          <span className="material-icons-round text-base">bar_chart</span>
          Generate Report
        </H2HButton>

        <H2HButton variant="ghost" onClick={() => window.location.reload()}>
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
function StatCard({ label, value, color = "blue" }) {
  const colorClass =
    color === "gold"
      ? "from-yellow-400/60 to-yellow-200/40 text-yellow-300"
      : "from-blue-400/60 to-blue-200/40 text-blue-300";

  return (
    <H2HCard
      className={`p-4 text-center shadow-[0_0_18px_rgba(0,0,0,0.1)] bg-gradient-to-br ${colorClass}`}
    >
      <h3 className="text-sm text-[var(--fg-muted)] mb-1">{label}</h3>
      <p className="text-2xl font-semibold text-[var(--fg)]">{value}</p>
    </H2HCard>
  );
}
