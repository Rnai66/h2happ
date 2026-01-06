export default function H2HTag({ text, color = "blue", className = "" }) {
  const colors = {
    gold: "bg-[rgba(242,193,78,0.15)] text-[var(--accent)] border border-[rgba(242,193,78,0.25)]",
    blue: "bg-[rgba(95,162,248,0.12)] text-[var(--accent2)] border border-[rgba(95,162,248,0.25)]",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-md font-medium ${colors[color]} ${className}`}
    >
      {text}
    </span>
  );
}
