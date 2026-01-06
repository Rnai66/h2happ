import { NavLink } from "react-router-dom";

const Tab = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "flex flex-col items-center justify-center gap-1 py-2",
        "text-xs",
        isActive ? "text-white" : "text-white/60",
      ].join(" ")
    }
  >
    <div className={[
      "h-9 w-9 grid place-items-center rounded-xl",
      isActive ? "bg-white/10 border border-white/15" : "bg-transparent"
    ].join(" ")}>
      <span className="text-base">{icon}</span>
    </div>
    <span className="leading-none">{label}</span>
  </NavLink>
);

export default function MobileShell({ title, right, children }) {
  return (
    <div className="h2h-bg">
      {/* Top Bar */}
      <div className="sticky top-0 z-20">
        <div className="px-4 pt-4 pb-3">
          <div className="h2h-card rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-white/60">H2H Thailand</div>
              <div className="text-base font-semibold tracking-tight">{title}</div>
            </div>
            <div className="flex items-center gap-2">{right}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">{children}</div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="px-4 pb-4">
          <div className="h2h-card rounded-2xl px-2 py-2 grid grid-cols-4">
            <Tab to="/" label="Home" icon="🏠" />
            <Tab to="/listings" label="Listings" icon="🛍️" />
            <Tab to="/chat" label="Chat" icon="💬" />
            <Tab to="/me" label="Me" icon="👤" />
          </div>
        </div>
      </div>
    </div>
  );
}
