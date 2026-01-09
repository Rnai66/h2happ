export default function Card({ children, className = '' }) {
  // Default to h2h-card if no specific bg/shadow class is likely provided,
  // but to be safe, let's just append the classes and remove the hardcoded bg-white.
  // Actually, 'h2h-card' handles bg and shadow.
  // If we remove bg-white/shadow here, we must ensure all usages have h2h-card.
  // Given the extensive refactor, I will assign 'h2h-card' as the default theme if not overridden?
  // Let's just strip the hardcoded styles and assume 'h2h-card' is used or passed.
  // BUT to be safe for non-refactored files, I will use:
  return <div className={`rounded-2xl transition overflow-hidden ${className.includes('h2h-card') ? '' : 'bg-white shadow'} ${className}`}>{children}</div>;
}
