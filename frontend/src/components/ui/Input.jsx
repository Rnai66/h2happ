export default function Input({ label, hint, error, className='', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input
        {...props}
        className={
          'w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue ' + className
        }
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
