import { Icons } from "./Icons";

const TABS = [
  { id: "dashboard", label: "Home",    Icon: Icons.Home    },
  { id: "order",     label: "Order",   Icon: Icons.Coffee  },
  { id: "map",       label: "Map",     Icon: Icons.Map     },
  { id: "past",      label: "History", Icon: Icons.History },
  { id: "profile",   label: "Profile", Icon: Icons.Profile },
];

export default function BottomNav({ view, onGotoView, activeOrderCount = 0, readyCount = 0, visible = true }) {
  if (!visible) return null;

  return (
    <nav className="bottom-nav">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`nav-btn${view === id ? " active" : ""}`}
          onClick={() => onGotoView(id)}
        >
          <span className="nav-icon-wrap">
            <span className="nav-svg-icon"><Icon /></span>
            {id === "dashboard" && readyCount > 0 && (
              <span className="notif-badge">{readyCount}</span>
            )}
            {id === "dashboard" && activeOrderCount > 0 && readyCount === 0 && (
              <span className="notif-dot" />
            )}
          </span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
