import { Users, Armchair, CheckCircle, Clock, Loader2, ArrowUpRight } from "lucide-react";
import type { SchoolClass } from "../types";

interface Props {
  schoolClass: SchoolClass;
  onApply: (classId: string) => void;
  loading: boolean;
  hasValidStudentId: boolean;
}

export default function ClassCard({ schoolClass, onApply, loading, hasValidStudentId }: Props) {
  const isFull = schoolClass.availableSeats <= 0;
  const occupiedSeats = schoolClass.totalSeats - schoolClass.availableSeats;
  const occupiedPercentage = schoolClass.totalSeats > 0
    ? Math.min(100, Math.max(0, (occupiedSeats / schoolClass.totalSeats) * 100))
    : 0;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <Users size={21} />
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
          isFull ? "border-slate-200 bg-slate-50 text-slate-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          <span className={`size-1.5 rounded-full ${isFull ? "bg-slate-400" : "bg-emerald-500"}`} />
          {isFull ? "No seats available" : "Admission open"}
        </span>
      </div>

      <h3 className="text-lg font-bold tracking-tight text-slate-900">{schoolClass.name}</h3>
      <p className="mt-1 text-sm text-slate-500">School admission application</p>

      <div className="my-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <Armchair size={16} className="mb-2 text-slate-500" />
          <p className="text-lg font-bold tabular-nums text-slate-900">{schoolClass.totalSeats}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>

        <div className="rounded-xl bg-amber-50 p-3">
          <Clock size={17} className="mb-2 text-amber-600" />
          <p className="text-lg font-bold tabular-nums text-slate-900">{schoolClass.heldSeats}</p>
          <p className="text-xs text-slate-500">On hold</p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-3">
          <CheckCircle size={17} className="mb-2 text-emerald-600" />
          <p className="text-lg font-bold tabular-nums text-slate-900">{schoolClass.confirmedSeats}</p>
          <p className="text-xs text-slate-500">Confirmed</p>
        </div>

        <div className="rounded-xl bg-indigo-50 p-3">
          <Users size={17} className="mb-2 text-indigo-600" />
          <p className="text-lg font-bold tabular-nums text-indigo-900">{schoolClass.availableSeats}</p>
          <p className="text-xs text-slate-600">Available</p>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">Seat availability</span>
        <span className="font-semibold tabular-nums text-slate-700">{schoolClass.availableSeats} of {schoolClass.totalSeats} left</span>
      </div>
      <div
        className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={`${schoolClass.name} seats filled`}
        aria-valuenow={Math.round(occupiedPercentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-[width] duration-500"
          style={{ width: `${occupiedPercentage}%` }}
        />
      </div>

      <button
        onClick={() => onApply(schoolClass.id)}
        disabled={isFull || loading || !hasValidStudentId}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-slate-300"
      >
        {loading && <Loader2 size={17} className="animate-spin" />}
        {loading ? "Applying..." : isFull ? "Seats Full" : !hasValidStudentId ? "Enter a valid BRN" : <>Apply for Admission <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>}
      </button>
    </article>
  );
}