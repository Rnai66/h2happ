import Icon from "./Icon";

export default function Button({
  icon,
  children,
  variant = "solid",
  size = "md",
  full = true,
  disabled = false,
  className = "",
  ...props
}) {
  const variants = {
    solid: "h2h-btn text-white",
    ghost: "h2h-btn-ghost text-white",
    tonal:
      "bg-white/10 border border-white/15 text-white backdrop-blur",
    danger:
      "bg-red-500/90 border border-red-400/40 text-white",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs rounded-xl",
    md: "h-11 px-4 text-sm rounded-2xl",
    lg: "h-13 px-5 text-base rounded-2xl",
  };

  return (
    <button
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${full ? "w-full" : "w-auto"}
        flex items-center justify-center gap-2
        font-semibold
        active:scale-[0.98] transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {icon && <Icon name={icon} size={20} />}
      <span className="leading-none">{children}</span>
    </button>
  );
}
