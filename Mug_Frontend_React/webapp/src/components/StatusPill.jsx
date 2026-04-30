import { STATUS_META } from "../constants/data";

export default function StatusPill({ status }) {
  const cls =
    status === "IN_PROGRESS"
      ? "pill pill-amber"
      : status === "READY_PICKUP"
      ? "pill pill-green"
      : "pill pill-sage";
  return <span className={cls}>{STATUS_META[status]?.label ?? status}</span>;
}
