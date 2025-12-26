export default function H2HButton({
  children,
  variant = "gold",
  onClick,
  type = "button",
  className = "",
}) {
  const base =
    "h2h-btn transition-all focus:outline-none active:scale-[0.98]";
  const variants = {
    gold: "h2h-btn-gold",
    ghost: "h2h-btn-ghost",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant] || ""} ${className}`}
    >
      {children}
    </button>
  );
}
