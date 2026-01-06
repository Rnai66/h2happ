import { useState, useEffect } from "react";
import {
  H2HCard,
  H2HButton,
  H2HModal,
  H2HTableRow,
  H2HTag,
  H2HSkeleton,
} from "../ui";
import { api } from "../api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchPayments() {
    try {
      setLoading(true);
      const res = await api("/api/payments?page=1&limit=20", { auth: true });
      setPayments(res.payments || []);
    } catch (e) {
      console.error("Failed to load payments:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="section page-fade">
      <div className="mb-6">
        <h1 className="title-glow mb-1">Payments</h1>
        <p className="subtitle text-[var(--fg-muted)]">
          รายการชำระเงิน / Transaction ทั้งหมดในระบบ
        </p>
      </div>

      <H2HCard className="overflow-hidden shadow-lg">
        {loading ? (
          <div className="grid gap-3">
            <H2HSkeleton height="2rem" />
            <H2HSkeleton height="2rem" />
            <H2HSkeleton height="2rem" />
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th className="th">Transaction</th>
                <th className="th">Amount</th>
                <th className="th text-right pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((p) => (
                  <H2HTableRow
                    key={p._id}
                    cells={[
                      p.txId || "—",
                      `${p.amount?.toFixed(2) || "0.00"} THB`,
                      <div key={p._id + "-status"} className="flex justify-end">
                        <H2HTag
                          text={p.status || "pending"}
                          color={
                            p.status === "success"
                              ? "gold"
                              : p.status === "failed"
                              ? "blue"
                              : "gray"
                          }
                        />
                      </div>,
                    ]}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="td text-center text-[var(--fg-muted)] italic py-6"
                  >
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="mt-5 flex justify-end">
          <H2HButton variant="ghost" onClick={fetchPayments}>
            <span className="material-icons-round text-base">refresh</span>
            Refresh
          </H2HButton>
        </div>
      </H2HCard>
    </div>
  );
}
