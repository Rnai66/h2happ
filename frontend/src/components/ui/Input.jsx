export default function Input({
  label,
  hint,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <input
        {...props}
        className={[
          // base
          "w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition",

          // 👇 สีที่ทำให้ชัด (หัวใจของปัญหา)
          "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",

          // focus
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",

          className,
        ].join(" ")}
      />

      {hint && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
