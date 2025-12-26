import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Modal from "../components/Modal";
import Skeleton from "../components/Skeleton";

export default function Items({ me, toast }) {
  const [q, setQ] = useState("Blue");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sort, setSort] = useState("-createdAt");
  const [status, setStatus] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [draft, setDraft] = useState({ title:"", price:0, description:"" });
  const [editId, setEditId] = useState(null);

  const canCreate = !!me;

  const params = useMemo(() => {
    const u = new URLSearchParams({ page, limit, sort });
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (includeDeleted) u.set("includeDeleted","1");
    return u.toString();
  }, [q, page, limit, sort, status, includeDeleted]);

  async function load() {
    setMsg(""); setLoading(true);
    try {
      const res = await api(`/api/items?${params}`);
      setRows(res.items || []);
      setTotal(res.total || 0);
    } catch (e) { setMsg(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [params]);

  function openNew() {
    if (!me) return toast.error("Please login first");
    setDraft({ title:"", price:0, description:"" });
    setOpenCreate(true);
  }

  async function submitNew(e) {
    e.preventDefault();
    try {
      const payload = { ...draft, price: Number(draft.price), sellerId: me._id };
      await api("/api/items", { method:"POST", body: payload, auth: true });
      toast.success("Created");
      setOpenCreate(false);
      load();
    } catch (e) { toast.error(e.message); }
  }

  function openEditItem(item) {
    setEditId(item._id);
    setDraft({ title:item.title, price:item.price, description:item.description||"" });
    setOpenEdit(true);
  }

  async function submitEdit(e) {
    e.preventDefault();
    try {
      await api(`/api/items/${editId}`, { method:"PUT", body:{ ...draft, price: Number(draft.price) }, auth:true });
      toast.success("Updated");
      setOpenEdit(false); setEditId(null);
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function softDelete(id) {
    if (!confirm("Soft-delete this item?")) return;
    try {
      await api(`/api/items/${id}`, { method:"DELETE", auth:true });
      toast("Soft-deleted");
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function softRestore(id) {
    try {
      await api(`/api/items/${id}`, { method:"PUT", body:{ isDeleted:false }, auth:true });
      toast.success("Restored");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-semibold text-bro-gold">Items</h3>
        <div className="ml-auto flex items-center gap-2">
          <input className="input w-48" value={q} onChange={e=>{setPage(1); setQ(e.target.value);}} placeholder="search q" />
          <select className="select" value={status} onChange={e=>{setPage(1); setStatus(e.target.value);}}>
            <option value="">status: all</option>
            <option value="active">active</option>
            <option value="sold">sold</option>
            <option value="hidden">hidden</option>
          </select>
          <select className="select" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="-price">Price high → low</option>
            <option value="price">Price low → high</option>
          </select>
          <label className="flex items-center gap-2 text-white/80">
            <input type="checkbox" checked={includeDeleted} onChange={e=>setIncludeDeleted(e.target.checked)} />
            Include Deleted
          </label>
          <button className="btn btn-gold" onClick={openNew} disabled={!canCreate}>+ New</button>
        </div>
      </div>

      {loading ? (
        <Skeleton rows={5} cols={6} />
      ) : (
        <div className="overflow-x-auto card">
          <table className="table">
            <thead>
              <tr>
                <th className="th">ID</th>
                <th className="th">Title</th>
                <th className="th">Price</th>
                <th className="th">Status</th>
                <th className="th">Seller</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id}>
                  <td className="td font-mono">{r._id}</td>
                  <td className="td">{r.title}</td>
                  <td className="td">{r.price}</td>
                  <td className="td">{r.status}</td>
                  <td className="td font-mono">{r.sellerId}</td>
                  <td className="td">
                    {!r.isDeleted ? (
                      <>
                        <button className="btn btn-ghost" onClick={()=>openEditItem(r)}>Edit</button>{" "}
                        <button className="btn btn-primary" onClick={()=>softDelete(r._id)}>Soft-delete</button>
                      </>
                    ) : (
                      <button className="btn btn-gold" onClick={()=>softRestore(r._id)}>Restore</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button className="btn btn-ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
        <span className="text-white/70">{page} / {Math.max(1, Math.ceil(total/limit))}</span>
        <button className="btn btn-ghost" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>

      {msg && <div className="text-red-400">{msg}</div>}

      {/* Create Modal */}
      <Modal open={openCreate} title="Create Item" onClose={()=>setOpenCreate(false)}>
        <form onSubmit={submitNew} className="grid gap-3">
          <input className="input" required value={draft.title} onChange={e=>setDraft(s=>({...s, title:e.target.value}))} placeholder="title" />
          <input className="input" required type="number" min="0" value={draft.price} onChange={e=>setDraft(s=>({...s, price:e.target.value}))} placeholder="price" />
          <textarea className="textarea" value={draft.description} onChange={e=>setDraft(s=>({...s, description:e.target.value}))} placeholder="description" rows={3} />
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-ghost" onClick={()=>setOpenCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Create</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={openEdit} title="Edit Item" onClose={()=>setOpenEdit(false)}>
        <form onSubmit={submitEdit} className="grid gap-3">
          <input className="input" required value={draft.title} onChange={e=>setDraft(s=>({...s, title:e.target.value}))} placeholder="title" />
          <input className="input" required type="number" min="0" value={draft.price} onChange={e=>setDraft(s=>({...s, price:e.target.value}))} placeholder="price" />
          <textarea className="textarea" value={draft.description} onChange={e=>setDraft(s=>({...s, description:e.target.value}))} placeholder="description" rows={3} />
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-ghost" onClick={()=>setOpenEdit(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
