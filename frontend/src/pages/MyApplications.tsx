
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import type { StudentHold } from "../types";
import { getStudentId } from "../services/student";


function getRemainingTime(expiresAt: string) {
  const seconds = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function MyApplications() {
  const [holds, setHolds] = useState<StudentHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [, setTick] = useState(0);



const studentId = getStudentId();

  const fetchHolds = useCallback(async () => {
    if (!studentId) {
      setHolds([]);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<StudentHold[]>("/me/holds", {
        headers: { "X-Student-Id": studentId },
      });

      setHolds(response.data);
      setError("");
    } catch {
      setError("Unable to load your applications.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHolds();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchHolds();

    const refreshTimer = window.setInterval(() => {
      void fetchHolds();
    }, 5000);

    const clockTimer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [fetchHolds]);

  const handleAction = async (
    holdId: string,
    action: "confirm" | "cancel"
  ) => {
    if (!studentId) return;

    if (
      action === "cancel" &&
      !window.confirm("Are you sure you want to cancel this application?")
    ) return;

    setActionId(holdId);
    setError("");
    setMessage("");

    try {
      const config = {
        headers: { "X-Student-Id": studentId },
      };

      if (action === "confirm") {
        await api.post(`/holds/${holdId}/confirm`, {}, config);
        setMessage("Admission confirmed successfully!");
      } else {
        await api.delete(`/holds/${holdId}`, config);
        setMessage("Application cancelled successfully.");
      }

      await fetchHolds();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Action failed. Please try again."
      );
      await fetchHolds();
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center px-5 text-slate-500">
        <Loader2 size={26} className="mb-3 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading applications...</span>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Admissions</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">My Applications</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            View and manage your admission applications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle size={19} className="mt-0.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div role="status" className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <CheckCircle size={19} className="mt-0.5 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {holds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Clock size={23} />
          </span>
          <h2 className="font-semibold text-slate-900">No applications yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Apply for a class from the dashboard to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {holds.map((hold) => {
            const remaining = getRemainingTime(hold.expiresAt);
            const expiredByClock = hold.status === "HELD" && remaining === "0:00";

            return (
              <article
                key={hold.holdId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] transition hover:border-slate-300 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      {hold.className}
                    </h2>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      Application ID: <span className="font-medium text-slate-700">{hold.holdId}</span>
                    </p>
                  </div>

                  <StatusBadge
                    status={expiredByClock ? "EXPIRED" : hold.status}
                  />
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  Applied on{" "}
                  <time dateTime={hold.createdAt} className="font-medium text-slate-700">
                    {new Date(hold.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </p>

                {hold.status === "HELD" && (
                  <div className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
                    expiredByClock
                      ? "border-slate-200 bg-slate-50 text-slate-600"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}>
                    <Clock className="shrink-0" size={16} />
                    {expiredByClock
                      ? "This hold has expired. Refreshing status..."
                      : `Time remaining: ${remaining}`}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {hold.status === "HELD" && !expiredByClock && (
                    <>
                      <button
                        type="button"
                        disabled={actionId === hold.holdId}
                        onClick={() => void handleAction(hold.holdId, "confirm")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
                      >
                        {actionId === hold.holdId ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        {actionId === hold.holdId ? "Processing..." : "Confirm Admission"}
                      </button>

                      <button
                        type="button"
                        disabled={actionId === hold.holdId}
                        onClick={() => void handleAction(hold.holdId, "cancel")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                      >
                        <XCircle size={16} /> Cancel Hold
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
