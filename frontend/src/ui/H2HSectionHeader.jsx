import React from "react";

export default function H2HSectionHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-3">
      <span className="material-icons-round text-[var(--accent)] text-3xl drop-shadow-[0_0_8px_rgba(242,193,78,0.4)]">
        {icon}
      </span>
      <div>
        <h1 className="title-glow text-xl sm:text-2xl tracking-wide">{title}</h1>
        {subtitle && (
          <p className="text-[var(--fg-muted)] text-sm mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
