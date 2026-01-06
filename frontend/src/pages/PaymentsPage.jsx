import { useState, useEffect } from "react";
import {
  H2HCard,
  H2HButton,
  H2HModal,
  H2HTableRow,
  H2HTag,
  H2HSkeleton,
} from "../ui";

export default function PaymentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  // mock data
  const mockPayments = [
    {
      id: 1,
      user: "Admin",
      amount: 1200,
      date: "2025-10-30",
      status: "Completed",
    },
    {
      id: 2,
      user: "Tester",
      amount: 499,
      date: "2025-10-29",
      status: "Pending",
    },
    {
      id: 3,
      user: "Demo",
      amount: 750,
      date: "2025-10-27",
      status: "Failed",
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setPayments(mockPayments);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="section page-fade">
      {/* ================= Header ================= */}
      <div className="mb-6">
        <h1 className="title-glow mb-1">Payments</h1>
        <p className="subtitle text-[var(--fg-muted)]">
          แสดงข้อมูลธุรกรรมการชำระเงินทั้งหมดในระบบ H2H Thailand
        </p>
      </div>

      {/* ================= Table ================= */}
      <H2HCard className="overflow-hidden shadow-lg">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="th">User</th>
              <th className="th">Amount (฿)</th>
              <th className="th">Date</th>
              <th className="th text-right pr-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td colSpan="4" className="td">
                    <H2HSkeleton height="30px" />
                  </td>
                </tr>
              ))
            ) : payments.length > 0 ? (
              payments.map((p) => (
                <H2HTableRow
                  key={p.id}
                  cells={[
                    p.user,
                    <span key={p.id + "-amount"} className="num">
                      {p.amount.toLocaleString()}
                    </span>,
                    new Date(p.date).toLocaleDateString(),
                    <div className="flex justify-end" key={p.id + "-status"}>
                      <H2HTag
                        text={p.status}
                        color={
                          p.status === "Completed"
                            ? "gold"
                            : p.status === "Pending"
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
                  colSpan="4"
                  className="td text-center text-[var(--fg-muted)] italic py-6"
                >
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ================= Footer Buttons ================= */}
        <div className="mt-5 flex gap-3 justify-end">
          <H2HButton
            variant="gold"
            onClick={() => setShowModal(true)}
            className="shadow-[0_0_15px_rgba(242,193,78,0.25)]"
          >
            <span className="material-icons-round text-base">add</span>
            Add Payment
          </H2HButton>

          <H2HButton
            variant="ghost"
            onClick={() => window.location.reload()}
            className="hover:opacity-80"
          >
            <span className="material-icons-round text-base">refresh</span>
            Refresh
          </H2HButton>
        </div>
      </H2HCard>

      {/* ================= Modal: Add New Payment ================= */}
      <H2HModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Payment"
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setShowModal(false);
          }}
        >
          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              User Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter user name"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              Amount (฿)
            </label>
            <input
              type="number"
              className="input"
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              Status
            </label>
            <select className="select">
              <option>Completed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <H2HButton
              variant="ghost"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </H2HButton>

            <H2HButton
              variant="gold"
              type="submit"
              className="shadow-[0_0_12px_rgba(242,193,78,0.25)]"
            >
              Save
            </H2HButton>
          </div>
        </form>
      </H2HModal>
    </div>
  );
}
