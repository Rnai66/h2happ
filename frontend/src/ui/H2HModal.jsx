export default function H2HModal({ show, onClose, title, children }) {
  if (!show) return null;

  return (
    <div
      className="modal-wrap fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        className="modal bg-[var(--glass)] border border-[var(--glass-border)] rounded-xl p-6 shadow-xl backdrop-blur-xl w-full max-w-md text-[var(--fg)]"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-xl font-semibold mb-3 text-[var(--accent)]">
            {title}
          </h2>
        )}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
