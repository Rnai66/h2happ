import React from "react";

export default function Skeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="card animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-white/10 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
