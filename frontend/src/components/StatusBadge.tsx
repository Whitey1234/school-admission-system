import type { HoldStatus } from "../types";

interface Props {
  status: HoldStatus;
}

const styles: Record<HoldStatus, string> = {
  HELD: "border-amber-200 bg-amber-50 text-amber-800",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-600",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}