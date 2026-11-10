import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    CheckCircle,
    Clock3,
    Loader2,
    Plus,
    RefreshCw,
    School,
    Users,
} from "lucide-react";
import api, { getApiError } from "../services/api";
import ClassCard from "../components/ClassCard";
import type { SchoolClass } from "../types";
import { useStudentIdentity } from "../context/StudentIdentityContext";
import { isValidBirthRegistrationNumber } from "../services/student";

export default function Dashboard() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const {
        birthRegistrationNumber,
        isValid: hasValidStudentId,
        setBirthRegistrationNumber,
    } = useStudentIdentity();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [className, setClassName] = useState("");
    const [totalSeatsInput, setTotalSeatsInput] = useState("30");
    const [creatingClass, setCreatingClass] = useState(false);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();

        const seats = Number(totalSeatsInput);

        if (!className.trim() || !Number.isInteger(seats) || seats <= 0) {
            setError("Enter a valid class name and positive seat count.");
            return;
        }

        setCreatingClass(true);
        setError("");
        setMessage("");

        try {
            await api.post("/classes", {
                name: className.trim(),
                totalSeats: seats,
            });

            setClassName("");
            setTotalSeatsInput("30");
            setMessage("Class created successfully!");

            await fetchClasses();
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setCreatingClass(false);
        }
    };

    const fetchClasses = useCallback(async () => {
        try {
            const response = await api.get<SchoolClass[]>("/classes");
            setClasses(response.data);
            setError("");
        } catch {
            setError("Could not load classes. Please check the backend connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchClasses();
        const timer = window.setInterval(() => void fetchClasses(), 5000);
        return () => window.clearInterval(timer);
    }, [fetchClasses]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchClasses();
        } finally {
            setRefreshing(false);
        }
    };

    const handleApply = async (classId: string) => {
        const studentId = birthRegistrationNumber;
        if (!isValidBirthRegistrationNumber(studentId)) {
            setError("Enter a valid 17-digit Birth Registration Number before applying.");
            return;
        }

        setApplyingId(classId);
        setError("");
        setMessage("");

        try {
            await api.post(`/classes/${classId}/holds`, {}, {
                headers: { "X-Student-Id": studentId },
            });

            setMessage("Your seat has been held successfully!");
            await fetchClasses();
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setApplyingId(null);
        }
    };

    const totalSeats = classes.reduce((sum, item) => sum + item.totalSeats, 0);
    const availableSeats = classes.reduce((sum, item) => sum + item.availableSeats, 0);
    const confirmedSeats = classes.reduce((sum, item) => sum + item.confirmedSeats, 0);
    const heldSeats = classes.reduce((sum, item) => sum + item.heldSeats, 0);

    const statistics = [
        { label: "Total Classes", value: classes.length, icon: School, color: "bg-indigo-50 text-indigo-700", detail: "Available learning groups" },
        { label: "Total Seats", value: totalSeats, icon: Users, color: "bg-blue-50 text-blue-700", detail: `${confirmedSeats} confirmed admissions` },
        { label: "Seats on Hold", value: heldSeats, icon: Clock3, color: "bg-amber-50 text-amber-700", detail: "Temporarily reserved" },
        { label: "Available Seats", value: availableSeats, icon: CheckCircle, color: "bg-emerald-50 text-emerald-700", detail: "Ready for admission" },
    ];

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">School Admission System</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Admission Dashboard</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                        Manage school admission applications and available seats.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                    <button
                        type="button"
                        onClick={() => void handleRefresh()}
                        disabled={refreshing}
                        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </section>

            {error && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    <AlertCircle size={19} className="mt-0.5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {message && (
                <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                    <CheckCircle size={19} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>{message}</span>
                </div>
            )}

            <section aria-label="Admission statistics" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statistics.map((item) => (
                    <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)]">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                                <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-950">{item.value}</p>
                            </div>
                            <span className={`flex size-11 items-center justify-center rounded-xl ${item.color}`}>
                                <item.icon size={21} />
                            </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">{item.detail}</p>
                    </article>
                ))}
            </section>

            <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <Plus size={20} />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900">Create a class</h2>
                        <p className="mt-1 text-sm text-slate-500">Set up a new class and define its admission capacity.</p>
                    </div>
                </div>

                <form onSubmit={handleCreateClass} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
                    <div>
                        <label htmlFor="class-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Class name</label>
                        <input
                            id="class-name"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="e.g. Class 6 - Morning Shift"
                            maxLength={150}
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="total-seats" className="mb-1.5 block text-sm font-semibold text-slate-700">Total seats</label>
                        <input
                            id="total-seats"
                            type="number"
                            min="1"
                            step="1"
                            value={totalSeatsInput}
                            onChange={(e) => setTotalSeatsInput(e.target.value)}
                            required
                            placeholder="Total seats"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={creatingClass}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-slate-300"
                    >
                        {creatingClass ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
                        {creatingClass ? "Creating..." : "Create Class"}
                    </button>
                </form>
            </section>

            <section className="mb-8 rounded-2xl border border-indigo-100 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] sm:p-6">
                <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-900">
                    Enter NID for Apply
                </h2>
                <label htmlFor="birth-registration-number" className="block text-sm font-semibold text-slate-800">
                    Birth Registration Number (17 Digits)
                </label>
                <input
                    id="birth-registration-number"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    maxLength={17}
                    pattern="[0-9]{17}"
                    value={birthRegistrationNumber}
                    onChange={(event) => setBirthRegistrationNumber(event.target.value.replace(/[^0-9]/g, "").slice(0, 17))}
                    aria-invalid={!hasValidStudentId}
                    aria-describedby="brn-help brn-validation"
                    placeholder="Enter your 17-digit Birth Registration Number"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:max-w-xl"
                />
                <p id="brn-help" className="mt-2 text-sm text-slate-500">
                    Your Birth Registration Number will be used as your student identity for admission applications.
                </p>
                <p
                    id="brn-validation"
                    role={birthRegistrationNumber.length > 0 && !hasValidStudentId ? "alert" : "status"}
                    className={`mt-1 text-sm ${hasValidStudentId ? "text-emerald-700" : "text-amber-700"}`}
                >
                    {hasValidStudentId
                        ? "Valid 17-digit number."
                        : birthRegistrationNumber.length > 0
                            ? "Enter exactly 17 numeric digits."
                            : "Enter a valid 17-digit number to apply for admission."}
                </p>
            </section>

            <section>
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Available Classes</h2>
                        <p className="mt-1 text-sm text-slate-600">Choose a class to apply for admission.</p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">{classes.length} {classes.length === 1 ? "class" : "classes"}</p>
                </div>

                {loading ? (
                    <div role="status" className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                        <Loader2 size={25} className="mb-3 animate-spin text-indigo-600" />
                        <span className="text-sm font-medium">Loading classes...</span>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
                        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <School size={23} />
                        </span>
                        <h3 className="font-semibold text-slate-900">No classes available yet</h3>
                        <p className="mt-1 text-sm text-slate-500">Create a class above to open admissions.</p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {classes.map((schoolClass) => (
                            <ClassCard
                                key={schoolClass.id}
                                schoolClass={schoolClass}
                                onApply={handleApply}
                                loading={applyingId === schoolClass.id}
                                hasValidStudentId={hasValidStudentId}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
