import React, { useEffect, useState } from "react";

export default function Modal({ open, title, children, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      // หน่วงเล็กน้อยเพื่อให้เล่นแอนิเมชันจางหาย
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open && !mounted) return null;

  // สถานะกำลังแสดง?
  const visible = open;

  return (
    <div
      className={
        "fixed inset-0 z-50 grid place-items-center p-4 transition-colors duration-150 " +
        (visible ? "bg-black/50 backdrop-blur-sm" : "bg-black/0 backdrop-blur-0")
      }
      onClick={onClose}
    >
      <div
        className={
          "w-full max-w-xl card transition-all duration-150 " +
          (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-bro-gold">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="grid gap-3">{children}</div>
      </div>
    </div>
  );
}
