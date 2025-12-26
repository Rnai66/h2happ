export default function H2HFormField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  options = [],
}) {
  return (
    <div className="grid gap-1">
      <label className="text-sm text-[var(--fg-muted)]">{label}</label>
      {type === "select" ? (
        <select className="select" value={value} onChange={onChange}>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}
