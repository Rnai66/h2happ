export default function Chip({ children, active=false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-sm ${active ? 'bg-brand-blue text-white border-brand-blue' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
    >
      {children}
    </button>
  );
}
