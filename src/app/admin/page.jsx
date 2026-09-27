// src/app/admin/page.jsx
import Link from "next/link";
import { format } from "date-fns";
import {
    CalendarDays,
    TrendingUp,
    IndianRupee,
    Activity,
    ArrowRight,
    Clock,
    Wallet,
    Smartphone,
} from "lucide-react";
import {
    getDashboardStats,
    getTodayBookings,
    getPendingBookings,
} from "@/app/actions/admin";
import PendingApprovals from "./_components/PendingApprovals";


export const dynamic = "force-dynamic";

function formatINR(value) {
    const n = Number(value);
    if (!n) return "₹0";
    return `₹${n.toLocaleString("en-IN")}`;
}

function StatCard({ icon: Icon, label, value, sub, accent = "turf" }) {
    const accentClasses = {
        turf: "from-turf-400 to-turf-600",
        amber: "from-amber-400 to-amber-600",
        blue: "from-sky-400 to-blue-600",
        pink: "from-pink-400 to-rose-600",
    }[accent];

    return (
        <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm transition-all hover:border-turf-300 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-ink-900">{value}</p>
                    {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
                </div>
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accentClasses} text-white shadow-glow`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default async function AdminOverview() {
    const [stats, todayBookings, pending] = await Promise.all([
        getDashboardStats(),
        getTodayBookings(),
        getPendingBookings(),
    ]);

    const today = format(new Date(), "EEEE, MMM d");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-turf-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-turf-700">
                    <Activity className="h-3.5 w-3.5" />
                    Dashboard
                </span>
                <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                    Overview
                </h1>
                <p className="mt-1 text-sm text-ink-500">{today}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={CalendarDays}
                    label="Today's bookings"
                    value={stats.todayBookings}
                    sub={`${stats.occupancy}% occupancy today`}
                    accent="turf"
                />
                <StatCard
                    icon={IndianRupee}
                    label="Today's revenue"
                    value={formatINR(stats.todayRevenue)}
                    sub="Confirmed bookings only"
                    accent="amber"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Last 7 days"
                    value={formatINR(stats.weekRevenue)}
                    sub="Rolling week revenue"
                    accent="blue"
                />
                <StatCard
                    icon={Activity}
                    label="Active pitches"
                    value={stats.activePitches}
                    sub={`${stats.monthRevenue ? formatINR(stats.monthRevenue) + " this month" : "—"}`}
                    accent="pink"
                />
            </div>

            {/* Pending approvals */}
            <PendingApprovals initialPending={pending} />

            {/* Today's bookings */}
            <div className="rounded-3xl border border-ink-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-ink-100 p-5">
                    <div>
                        <h2 className="text-lg font-extrabold text-ink-900">
                            Today&apos;s bookings
                        </h2>
                        <p className="mt-0.5 text-xs text-ink-500">
                            {todayBookings.length} booking
                            {todayBookings.length === 1 ? "" : "s"} for today
                        </p>
                    </div>
                    <Link
                        href="/admin/bookings"
                        className="group inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-700 transition-all hover:border-turf-400 hover:bg-turf-50 hover:text-turf-700"
                    >
                        View all
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>

                {todayBookings.length === 0 ? (
                    <div className="p-10 text-center">
                        <Clock className="mx-auto h-8 w-8 text-ink-300" />
                        <p className="mt-3 text-sm font-medium text-ink-500">
                            No bookings yet for today.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-ink-100">
                        {todayBookings.slice(0, 8).map((b) => (
                            <li
                                key={b.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-ink-50/60"
                            >
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-turf-50 ring-1 ring-turf-100">
                                        <span className="text-xs font-extrabold text-turf-700">
                                            {b.startTime}
                                        </span>
                                        <span className="text-[9px] uppercase text-turf-600/70">
                                            {b.endTime}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-ink-900">
                                            {b.pitchName}
                                        </p>
                                        <p className="truncate text-xs text-ink-500">
                                            {b.userName} · {b.userEmail}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {b.paymentMethod === "bkash" ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-700">
                                            <Smartphone className="h-3 w-3" />
                                            bKash
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                            <Wallet className="h-3 w-3" />
                                            Cash
                                        </span>
                                    )}
                                    <span className="text-sm font-extrabold text-turf-700">
                                        {formatINR(b.totalPrice)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}