import { useState, useEffect } from "react";
import { Icons } from "../components/Icons";
import { cafes, coffees } from "../constants/data";

function DrinkIcon({ iconName }) {
  const Icon = Icons[iconName];
  if (!Icon) return <Icons.Coffee />;
  return <Icon />;
}

export default function OrderView({ visible, onOrder, preSelectedCafe, onClearPreSelected, preOrderItem, onClearPreOrderItem, user }) {
  const defaultCafe = cafes.find(c => c.mugs > 0) || cafes[0];
  const [selectedCafe, setSelectedCafe] = useState(defaultCafe);
  const [showCafePicker, setShowCafePicker] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null); // { coffee, cafe }
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState(null); // "success" | "error"
  const [pendingOrderId, setPendingOrderId] = useState(null);

  useEffect(() => {
    if (preSelectedCafe) {
      setSelectedCafe(preSelectedCafe);
      onClearPreSelected?.();

      // If also reordering, open confirm modal immediately using preSelectedCafe
      // directly rather than waiting for selectedCafe state to update
      if (preOrderItem) {
        const coffee = coffees.find(c => c.label === preOrderItem || c.id === preOrderItem);
        if (coffee) { const oid2 = Math.random().toString(36).substring(2,8).toUpperCase(); setPendingOrderId(oid2); setConfirmOrder({ coffee, cafe: preSelectedCafe }); }
        onClearPreOrderItem?.();
      }
    }
  }, [preSelectedCafe, preOrderItem, onClearPreSelected, onClearPreOrderItem]);

  if (!visible) return null;

  const cafeMenu = coffees.filter(c => selectedCafe.menu.includes(c.id));

  const handleConfirm = async () => {
    if (!confirmOrder) return;
    setPlacing(true);
    try {
      const ok = await onOrder(confirmOrder.coffee, confirmOrder.cafe);
      if (ok === "no_mugs") setResult("no_mugs");
      else setResult(ok === false ? "error" : "success");
    } catch {
      setResult("error");
    }
    setPlacing(false);
  };

  const handleDismissResult = () => {
    setResult(null);
    setConfirmOrder(null);
  };

  return (
    <main className="view">
      <div className="page-header">
        <div className="page-title">Menu</div>
        <div className="page-sub">Order in a reusable mug — as easy as disposables</div>
      </div>

      {/* Ordering from */}
      <div className="section-label">Ordering from</div>
      <button className="ordering-from-card" onClick={() => setShowCafePicker(true)}>
        <div className="thumb"><Icons.Store /></div>
        <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
          <div className="ordering-from-name">{selectedCafe.name}</div>
          <div className="ordering-from-meta">{selectedCafe.address} · {selectedCafe.dist}</div>
        </div>
        <div className="ordering-from-change">Change ›</div>
      </button>

      {/* Cafe picker */}
      {showCafePicker && (
        <div className="modal-overlay" onClick={() => setShowCafePicker(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCafePicker(false)}>✕</button>
            <div className="modal-headline" style={{ marginBottom: 4 }}>Choose a cafe</div>
            <p style={{ fontSize:"0.76rem", color:"var(--text-muted)", marginBottom:12 }}>
              Each cafe has its own menu selection
            </p>
            {cafes.map((cafe) => (
              <button key={cafe.id}
                className={`cafe-picker-row${selectedCafe.id === cafe.id ? " selected" : ""}${cafe.mugs === 0 ? " disabled" : ""}`}
                onClick={() => { if (cafe.mugs > 0) { setSelectedCafe(cafe); setShowCafePicker(false); } }}
                disabled={cafe.mugs === 0}
              >
                <div style={{ textAlign:"left" }}>
                  <div className="cafe-picker-name">{cafe.name}</div>
                  <div className="cafe-picker-meta">{cafe.area} · {cafe.dist}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div className={cafe.mugs > 0 ? "mugs-avail" : "mugs-empty"}>
                    {cafe.mugs > 0 ? `${cafe.mugs} mugs` : "None"}
                  </div>
                  <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginTop:2 }}>
                    {cafe.menu.length} drinks
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm order modal */}
      {confirmOrder && !result && (
        <div className="modal-overlay" onClick={() => !placing && setConfirmOrder(null)}>
          <div className="modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-emoji"><div className="confirm-drink-icon"><DrinkIcon iconName={confirmOrder.coffee.icon} /></div></div>
            <div className="confirm-title">Confirm your order</div>

            <div className="confirm-rows">
              <div className="confirm-row">
                <span className="confirm-row-label">Name</span>
                <span className="confirm-row-value">{user}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Order #</span>
                <span className="confirm-row-value" style={{fontFamily:"monospace",fontSize:"0.78rem",letterSpacing:"0.03em"}}>{pendingOrderId}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Drink</span>
                <span className="confirm-row-value">{confirmOrder.coffee.label}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Cafe</span>
                <span className="confirm-row-value">{confirmOrder.cafe.name}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label">Address</span>
                <span className="confirm-row-value">{confirmOrder.cafe.address}</span>
              </div>
              <div className="confirm-row confirm-row-total">
                <span className="confirm-row-label">Total</span>
                <span className="confirm-row-value confirm-price">${confirmOrder.coffee.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="confirm-note">
              🫙 A reusable mug will be assigned at pickup. Return within 3 days.
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleConfirm}
              disabled={placing}
              style={{ marginTop: 4 }}
            >
              {placing ? (
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <span className="spinner" /> Placing order...
                </span>
              ) : "Place order"}
            </button>
            <button className="btn-link" onClick={() => setConfirmOrder(null)} disabled={placing}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success / Error modal */}
      {result && (
        <div className="modal-overlay" onClick={handleDismissResult}>
          <div className="modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
            {result === "success" ? (
              <>
                <div className="result-icon result-success">✓</div>
                <div className="confirm-title">Order placed!</div>
                <p className="confirm-note" style={{ textAlign:"center" }}>
                  Head to <strong>{confirmOrder?.cafe.name}</strong> and show this confirmation to the barista.<br /><br />
                  Your mug will be waiting.
                </p>
                <button className="btn btn-primary btn-full" onClick={handleDismissResult}>
                  Done
                </button>
              </>
            ) : result === "no_mugs" ? (
              <>
                <div className="result-icon result-error">!</div>
                <div className="confirm-title">No mugs available</div>
                <p className="confirm-note" style={{ textAlign:"center" }}>
                  There are no reusable mugs available at this cafe right now. Please try again later.
                </p>
                <button className="btn btn-primary btn-full" onClick={handleDismissResult}>
                  OK
                </button>
              </>
            ) : (
              <>
                <div className="result-icon result-error">!</div>
                <div className="confirm-title">Something went wrong</div>
                <p className="confirm-note" style={{ textAlign:"center" }}>
                  We couldn&apos;t place your order. Check your connection and try again.
                </p>
                <button className="btn btn-primary btn-full" onClick={handleDismissResult}>
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="section-label">
        {cafeMenu.length} drinks at {selectedCafe.name.split(" – ")[0].split(" @")[0]}
      </div>
      <div className="list">
        {cafeMenu.map((coffee) => (
          <div key={coffee.id} className="card">
            <div className="card-row">
              <div className="thumb drink-thumb"><DrinkIcon iconName={coffee.icon} /></div>
              <div className="card-body">
                <div className="card-title">{coffee.label}</div>
                <div className="card-meta">{coffee.blurb}</div>
              </div>
              <div className="price-tag">${coffee.price.toFixed(2)}</div>
            </div>
            <button
              className="order-btn"
              onClick={() => { const oid = Math.random().toString(36).substring(2,8).toUpperCase(); setPendingOrderId(oid); setConfirmOrder({ coffee, cafe: selectedCafe }); }}
            >
              Order with mug
            </button>
          </div>
        ))}
      </div>

      <div className="info-note">
        <span className="info-note-highlight">Return within 3 days to avoid a fee.</span> Show confirmation to the barista.
      </div>
    </main>
  );
}