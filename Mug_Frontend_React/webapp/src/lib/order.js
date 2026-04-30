export function coffeeIdToItem(coffeeId) {
  if (coffeeId === "Espresso") return "expresso";
  return coffeeId;
}

export function orderKey(o) {
  if (!o) return null;
  const k = o.orderId ?? o.id ?? o.order_id;
  return k != null && String(k) !== "" ? String(k) : null;
}

export function fmtDate(s) {
  if (!s) return "N/A";
  return new Date(s).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
