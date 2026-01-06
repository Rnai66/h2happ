import { useState } from "react";
import { api } from "../api";

export default function SlipUploader({ token, order, onUpdated }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const canUpload = order?.status === "PENDING_PAYMENT";

  const doUpload = async () => {
    if (!file || !order?._id) return;
    setBusy(true);
    const res = await api.uploadSlip(token, order._id, file);
    setBusy(false);
    onUpdated?.(res);
  };

  if (!canUpload) return null;
  return (
    <div className="p-3 rounded-2xl border shadow-sm">
      <div className="font-medium mb-2">อัปโหลดสลิปโอน</div>
      <input type="file" accept="image/*,application/pdf"
             onChange={e => setFile(e.target.files?.[0] || null)} />
      <button className="mt-2 px-4 py-2 rounded-2xl bg-blue-600 text-white disabled:opacity-50"
              disabled={!file || busy}
              onClick={doUpload}>
        {busy ? "กำลังอัปโหลด..." : "อัปโหลดสลิป"}
      </button>
    </div>
  );
}
