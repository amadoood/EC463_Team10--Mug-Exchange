import { useState } from "react";
import { fmtDate, orderKey } from "../lib/order";
import { Icons } from "../components/Icons";

function drinkIcon(item) {
  if (!item) return <Icons.Coffee />;
  const l = item.toLowerCase();
  if (l.includes("cold brew"))                     return <Icons.ColdBrew />;
  if (l.includes("matcha"))                        return <Icons.Matcha />;
  if (l.includes("cappuc") || l.includes("iced"))  return <Icons.IcedCoffee />;
  if (l.includes("pecan") || l.includes("latte"))  return <Icons.Latte />;
  if (l.includes("cortado"))                       return <Icons.Cortado />;
  if (l.includes("espresso"))                      return <Icons.Espresso />;
  return <Icons.Coffee />;
}

export default function PastView({ visible, returnedOrders, onReorder }) {
  const [expanded, setExpanded] = useState(null);

  if (!visible) return null;

  return (
    <main className="view">
      <div className="page-header">
        <div className="page-title">History</div>
        <div className="page-sub">{returnedOrders.length} completed returns</div>
      </div>

      <div className="section-label">Completed</div>

      {returnedOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🫙</div>
          <div className="empty-text">No completed orders yet. Return a mug to see your history.</div>
        </div>
      ) : (
        <div className="list">
          {returnedOrders.map((order, i) => {
            const key = orderKey(order) ?? i;
            const isOpen = expanded === key;
            return (
              <div key={key} className="card">
                {/* Main row — tappable to expand */}
                <div
                  className="card-row"
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  <div className="thumb drink-thumb">{drinkIcon(order.item)}</div>
                  <div className="card-body">
                    <div className="card-title">{order.item || "Drink"}</div>
                    <div className="card-meta">
                      {order.cafe_name && (
                        <strong style={{ color: "var(--olive-deep)" }}>{order.cafe_name} · </strong>
                      )}
                      {fmtDate(order.order_time)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span className="pill pill-sage">Returned</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="past-detail">
                    <div className="past-detail-rows">
                      <div className="past-detail-row">
                        <span>Order #</span>
                        <span style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600 }}>
                          {(order.id || order.orderId || "—").toString().substring(0, 6).toUpperCase()}
                        </span>
                      </div>
                      <div className="past-detail-row">
                        <span>Cafe</span>
                        <span>{order.cafe_name || "—"}</span>
                      </div>
                      <div className="past-detail-row">
                        <span>Mug</span>
                        <span>{order.mug_id || "—"}</span>
                      </div>
                      <div className="past-detail-row">
                        <span>Ordered</span>
                        <span>{fmtDate(order.order_time)}</span>
                      </div>
                      {order.price && (
                        <div className="past-detail-row">
                          <span>Price</span>
                          <span style={{ color: "#7a4a18", fontWeight: 600 }}>${Number(order.price).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {onReorder && (
                      <button className="order-btn" style={{ marginTop: 4 }} onClick={() => onReorder(order)}>
                        Order again at {order.cafe_name ? order.cafe_name.split(" –")[0].split(" @")[0] : "this cafe"} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
