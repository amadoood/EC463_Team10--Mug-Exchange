import { useState } from "react";
import { Icons } from "../components/Icons";
import StatusPill from "../components/StatusPill";
import { fmtDate, orderKey } from "../lib/order";

function dueDate(order_time) {
  if (!order_time) return null;
  const due = new Date(order_time);
  due.setDate(due.getDate() + 3);
  const now = new Date();
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { label, daysLeft, overdue: daysLeft < 0 };
}

export default function DashboardView({ visible, user, displayName, activeOrders, mugLogo, onGotoView }) {
  const [receiptOrder, setReceiptOrder] = useState(null);

  if (!visible) return null;

  const initials = user ? user.slice(0, 2).toUpperCase() : "??";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning,";
    if (h < 17) return "Good afternoon,";
    return "Good evening,";
  };

  return (
    <main className="view">
      <div className="dash-hero">
        <div className="dash-hero-left">
          <p className="dash-greeting">{greeting()}</p>
          <h1 className="dash-name">{displayName ? displayName.split(" ")[0] : user}</h1>
          <p className="dash-slogan">as easy as disposables</p>
        </div>
        <button className="dash-avatar" onClick={() => onGotoView("profile")}>{initials}</button>
      </div>

      <div className="section-label">Overview</div>
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-num">{activeOrders.length}</div>
          <div className="stat-label">Active mugs</div>
        </div>
        <div className="stat-card stat-card-accent">
          <div className="stat-num stat-num-light"><div className="stat-coffee-icon"><Icons.Coffee /></div></div>
          <div className="stat-label stat-label-light">Ready to order?</div>
          <button className="stat-cta" onClick={() => onGotoView("order")}>Browse menu →</button>
        </div>
      </div>

      {activeOrders.length > 0 && (
        <>
          <div className="section-label">Active orders — tap to view</div>
          <div className={`active-orders-scroll${activeOrders.length > 3 ? " is-scrollable" : ""}`}>
            {activeOrders.map((order, i) => {
              const step = order.status === "READY_PICKUP" ? 2 : 1;
              return (
                <div
                  key={orderKey(order) ?? i}
                  className="active-banner"
                  onClick={() => setReceiptOrder(order)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="active-banner-bar" />
                  <div className="active-banner-body">
                    <div className="active-banner-row">
                      <div>
                        <div className="active-banner-title">{order.item || "Drink"}</div>
                        <div className="active-banner-meta">
                          {order.cafe_name && <>{order.cafe_name} · </>}
                          Mug {order.mug_id || "—"}
                        </div>
                        {(() => {
                          const d = dueDate(order.order_time);
                          if (!d) return null;
                          return (
                            <div className={`due-date-tag${d.overdue ? " overdue" : d.daysLeft <= 1 ? " urgent" : ""}`}>
                              {d.overdue ? "⚠ Overdue" : `Return by ${d.label}`}
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusPill status={order.status} />
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>›</span>
                      </div>
                    </div>
                    <div className="status-steps">
                      {["Ordered","In Progress","Ready"].map((_, si) => (
                        <div key={si} className={`status-step${si<step?" done":si===step?" active-step":""}`} />
                      ))}
                    </div>
                    <div className="status-step-labels">
                      {["Ordered","In Progress","Ready"].map((label, si) => (
                        <span key={si} className={`step-label${si===step?" step-label-active":""}`}>{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Receipt / show barista modal */}
      {receiptOrder && (
        <div className="modal-overlay" onClick={() => setReceiptOrder(null)}>
          <div className="modal-card confirm-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setReceiptOrder(null)}>✕</button>
            <div className="receipt-icon"><Icons.Mug /></div>
            <div className="confirm-title">Show this to the barista</div>

            <div className="confirm-rows">
              <div className="confirm-row">
                <span className="confirm-row-label">Name</span>
                <span className="confirm-row-value">{displayName || user}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Order #</span>
                <span className="confirm-row-value" style={{fontFamily:"monospace",fontSize:"0.9rem",letterSpacing:"0.05em",fontWeight:600}}>{(receiptOrder.id || receiptOrder.orderId || "—").toString().substring(0,6).toUpperCase()}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Drink</span>
                <span className="confirm-row-value">{receiptOrder.item || "—"}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Cafe</span>
                <span className="confirm-row-value">{receiptOrder.cafe_name || "—"}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Mug</span>
                <span className="confirm-row-value">{receiptOrder.mug_id || "Not yet assigned"}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Ordered</span>
                <span className="confirm-row-value">{fmtDate(receiptOrder.order_time)}</span>
              </div>
              <div className="confirm-row confirm-row-total">
                <span className="confirm-row-label">Status</span>
                <span className="confirm-row-value"><StatusPill status={receiptOrder.status} /></span>
              </div>
            </div>

            <div className="confirm-note">
              {receiptOrder.status === "READY_PICKUP"
                ? "🎉 Your order is ready! Show this screen to pick up your mug."
                : "⏳ Your order is being prepared. Show this when it's ready."}
            </div>

            <button className="btn btn-primary btn-full" onClick={() => setReceiptOrder(null)}>Done</button>
          </div>
        </div>
      )}

      <div className="section-label">Quick actions</div>
      <div className="quick-actions">
        <button className="action-card" onClick={() => onGotoView("order")}>
          <div className="action-icon"><Icons.Coffee /></div>
          <div><div className="action-title">Order coffee</div><div className="action-sub">Browse the menu</div></div>
        </button>
        <button className="action-card" onClick={() => onGotoView("map")}>
          <div className="action-icon"><Icons.Map /></div>
          <div><div className="action-title">Find a cafe</div><div className="action-sub">Near you</div></div>
        </button>
        <button className="action-card action-card-full" onClick={() => onGotoView("past")}>
          <div className="action-icon"><Icons.History /></div>
          <div><div className="action-title">Order history</div><div className="action-sub">View past returns</div></div>
        </button>
      </div>

      <div className="eco-bar">
        <div className="eco-icon">🌿</div>
        <div>
          <div className="eco-title">You're making a difference</div>
          <div className="eco-sub">Every return keeps a cup out of the landfill</div>
        </div>
      </div>
      <div style={{height:8}}/>
    </main>
  );
}