import { useState, useEffect } from "react";
import { Icons } from "../components/Icons";

export default function ProfileView({ visible, user, displayName, userPhone, orders, onGotoView }) {
  const [notifs, setNotifs] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [realtime, setRealtime] = useState(true);

  // Read saved theme or fall back to device preference
  const getInitialTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  if (!visible) return null;

  const initials = user ? user.slice(0, 2).toUpperCase() : "??";
  const returned = orders.filter((o) => o.status === "MUG_RETURNED").length;

  return (
    <main className="view">
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        {displayName && <div className="profile-display-name">{displayName}</div>}
        <div className="profile-username">{displayName ? "" : user}</div>
        <div className="profile-user-sub">@{user}</div>
        {userPhone
          ? <div className="profile-phone">📱 ••• {userPhone.slice(-4)}</div>
          : <div className="profile-phone" style={{opacity:0.4}}>No phone on file</div>
        }
        <div className="profile-since">
          Member · {orders.length} orders · {returned} returned
        </div>
      </div>

      {/* Stats */}
      <div className="quick-stats" style={{ padding: "16px 20px 0" }}>
        <div className="stat-card">
          <div className="stat-num">{returned}</div>
          <div className="stat-label">Mugs returned</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{orders.length}</div>
          <div className="stat-label">Cups saved</div>
        </div>
      </div>

      <div className="section-label">Notifications</div>
      <div className="settings-group">
        <div className="settings-row" onClick={() => setNotifs((v) => !v)}>
          <div className="settings-row-left">
            <div className="settings-icon"><Icons.Bell /></div>
            <div>
              <div className="settings-title">Push notifications</div>
              <div className="settings-sub">Order updates and alerts</div>
            </div>
          </div>
          <div className={`toggle ${notifs ? "on" : ""}`} />
        </div>
        <div className="settings-row" onClick={() => setReminders((v) => !v)}>
          <div className="settings-row-left">
            <div className="settings-icon"><Icons.Clock /></div>
            <div>
              <div className="settings-title">Return reminders</div>
              <div className="settings-sub">Alert before mug due date</div>
            </div>
          </div>
          <div className={`toggle ${reminders ? "on" : ""}`} />
        </div>
        <div className="settings-row" onClick={() => setRealtime((v) => !v)}>
          <div className="settings-row-left">
            <div className="settings-icon"><Icons.Wifi /></div>
            <div>
              <div className="settings-title">Real-time status</div>
              <div className="settings-sub">Live tracking via WebSocket</div>
            </div>
          </div>
          <div className={`toggle ${realtime ? "on" : ""}`} />
        </div>
        <div className="settings-row" onClick={toggleTheme}>
          <div className="settings-row-left">
            <div className="settings-icon">{theme === "dark" ? <Icons.Moon /> : <Icons.Sun />}</div>
            <div>
              <div className="settings-title">Appearance</div>
              <div className="settings-sub">{theme === "dark" ? "Dark mode on" : "Light mode on"}</div>
            </div>
          </div>
          <div className={`toggle ${theme === "dark" ? "on" : ""}`} />
        </div>
      </div>

      <div className="section-label" style={{ paddingTop: 4 }}>Account</div>
      <div className="settings-group">
        <div className="settings-row">
          <div className="settings-row-left">
            <div className="settings-icon"><Icons.Shield /></div>
            <div><div className="settings-title">Privacy &amp; Security</div></div>
          </div>
          <span className="settings-chevron">›</span>
        </div>
        <div className="settings-row">
          <div className="settings-row-left">
            <div className="settings-icon"><Icons.Settings /></div>
            <div><div className="settings-title">App preferences</div></div>
          </div>
          <span className="settings-chevron">›</span>
        </div>
        <div className="settings-row" onClick={() => onGotoView("logout")}>
          <div className="settings-row-left">
            <div className="settings-icon settings-icon-danger">🚪</div>
            <div className="settings-title settings-title-danger">Log out</div>
          </div>
        </div>
      </div>

      <p className="profile-footer">
        Mug Exchange v1.0 · Made with care for the planet 🌿
      </p>
    </main>
  );
}
