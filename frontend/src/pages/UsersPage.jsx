import { useState, useEffect } from "react";
import {
  H2HCard,
  H2HButton,
  H2HModal,
  H2HTableRow,
  H2HTag,
  H2HSkeleton,
} from "../ui";
import api from "../lib/api"; // ✅ แก้ path ให้ถูก (api helper ต้องอยู่ใน src/lib/api.js)
import H2HSectionHeader from "../ui/H2HSectionHeader"; // ✅ ใช้ header ใหม่ที่เราสร้างไว้

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // ================= Load Users =================
  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api("/api/users", { auth: true });
      setUsers(res.users || []);
    } catch (e) {
      console.error("❌ Failed to load users:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= Render =================
  return (
    <div className="section page-fade">
      {/* Header */}
      <H2HSectionHeader
        icon="group"
        title="Users"
        subtitle="จัดการผู้ใช้งานทั้งหมดในระบบ H2H Thailand"
      />

      {/* Main Card */}
      <H2HCard className="overflow-hidden shadow-lg">
        {loading ? (
          <div className="grid gap-3 p-3">
            <H2HSkeleton height="2rem" />
            <H2HSkeleton height="2rem" />
            <H2HSkeleton height="2rem" />
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th text-right pr-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <H2HTableRow
                    key={u._id || u.id}
                    cells={[
                      u.name,
                      u.email,
                      <div
                        key={u._id + "-role"}
                        className="flex justify-end items-center"
                      >
                        <H2HTag
                          text={u.role}
                          color={u.role === "admin" ? "gold" : "blue"}
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
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Footer Buttons */}
        <div className="mt-5 flex gap-3 justify-end p-3">
          <H2HButton
            variant="gold"
            onClick={() => setShowModal(true)}
            className="shadow-[0_0_15px_rgba(242,193,78,0.25)]"
          >
            <span className="material-icons-round text-base">add</span>
            Add User
          </H2HButton>

          <H2HButton
            variant="ghost"
            onClick={fetchUsers}
            className="hover:opacity-80"
          >
            <span className="material-icons-round text-base">refresh</span>
            Refresh
          </H2HButton>
        </div>
      </H2HCard>

      {/* Modal */}
      <H2HModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Add New User"
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: ส่งข้อมูลไป backend /api/users
            setShowModal(false);
          }}
        >
          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter name"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="Enter email"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              Role
            </label>
            <select className="select">
              <option value="user">User</option>
              <option value="admin">Admin</option>
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
