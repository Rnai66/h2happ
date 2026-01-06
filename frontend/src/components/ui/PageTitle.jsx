export default function PageTitle({
  title,
  subtitle,
  align = "left",
}) {
  return (
    <div className={`mb-4 ${align === "center" ? "text-center" : ""}`}>
      <h1 className="text-[22px] md:text-2xl font-semibold tracking-tight
                     text-slate-900 dark:text-white leading-snug">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
          {subtitle}
        </p>
      )}
    </div>
  );
}
