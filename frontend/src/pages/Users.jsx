import React, { useEffect, useState } from "react";
import { api } from "../api";
import Skeleton from "../components/Skeleton";

export default function Users({ toast }) {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setMsg(""); setLoading(true);
    try {
      const res = await api(`/api/users?page=${page}&limit=${limit}`, { auth:true });
      setRows(res.users || []); setTotal(res.total || 0);
    } catch (e) { setMsg(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [page]);

  async function promote(id) {
    try { await api("/api/auth/promote", { method:"POST", body:{ userId: id }, auth:true });
      toast.success("Promoted to admin"); load();
    } catch (e) { toast.error(e.message); }
  }
  async function remove(id) {
    if (!confirm("Delete user permanently?")) return;
    try { await api(`/api/users/${id}`, { method:"DELETE", auth:true });
      toast("Deleted"); load();
    } catch (e) { toast.error(e.message); }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="grid gap-4">
      <h3 className="text-xl font-semibold text-bro-gold">Users (Admin)</h3>

      {loading ? (
        <Skeleton rows={5} cols={6} />
      ) : (
        <div className="overflow-x-auto card">
          <table className="table">
            <thead>
              <tr><th className="th">ID</th><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Created</th><th className="th">Action</th></tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u._id}>
                  <td className="td font-mono">{u._id}</td>
                  <td className="td">{u.name}</td>
                  <td className="td">{u.email}</td>
                  <td className="td">{u.role}</td>
                  <td className="td">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="td">
                    {u.role !== "admin" && <button className="btn btn-primary" onClick={()=>promote(u._id)}>Promote → admin</button>}{" "}
                    <button className="btn btn-ghost" onClick={()=>remove(u._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button className="btn btn-ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
        <span className="text-white/70">{page} / {pages}</span>
        <button className="btn btn-ghost" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>

      {msg && <div className="text-red-400">{msg}</div>}
    </div>
  );
}
