export default function H2HCard({ children, className = "" }) {
  return (
    <div className={`h2h-card p-4 sm:p-6 transition-all ${className}`}>
      {children}
    </div>
  );
}
