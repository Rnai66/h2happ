import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Tokens({ toast }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const res = await api(`/api/tokens?page=${page}&limit=${limit}`, { auth:true });
      setRows(res.tokens || []); setTotal(res.total || 0);
    } catch (e) { setMsg(e.message); }
  }
  useEffect(() => { load(); }, [page]);

  const pages = Math.max(1, Math.ceil(total/limit));
  return (
    <div className="grid gap-4">
      <h3 className="text-xl font-semibold text-bro-gold">Tokens (Admin)</h3>
      <div className="overflow-x-auto card">
        <table className="table">
          <thead>
            <tr><th className="th">ID</th><th className="th">Address</th><th className="th">Owner</th><th className="th">Balance</th><th className="th">Chain</th><th className="th">Created</th></tr>
          </thead>
          <tbody>
            {rows.map(t => (
              <tr key={t._id}>
                <td className="td font-mono">{t._id}</td>
                <td className="td font-mono">{t.address}</td>
                <td className="td font-mono">{t.ownerId}</td>
                <td className="td">{t.balance ?? 0}</td>
                <td className="td">{t.chain}</td>
                <td className="td">{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="btn btn-ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
        <span className="text-white/70">{page} / {pages}</span>
        <button className="btn btn-ghost" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
      {msg && <div className="text-red-400">{msg}</div>}
    </div>
  );
}
