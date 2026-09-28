// src/app/profile/ProfileClient.jsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format } from "date-fns";
import {
    User as UserIcon,
    Mail,
    Calendar,
    Wallet,
    Ticket,
    ArrowRight,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { format12h } from "@/lib/time";

function formatBDT(v) {
    const n = Number(v);
    if (!n) return "৳0";
    return `৳${n.toLocaleString("en-IN")}`;
}

function todayKeyLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function ProfileClient({ user, bookings }) {
    const stats = useMemo(() => {
        const today = todayKeyLocal();
        const now = new Date();
        const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const active = bookings.filter((b) => b.status !== "cancelled");
        const paid = active.filter((b) => b.paymentStatus === "paid");
        const totalSpent = paid.reduce((s, b) => s + Number(b.totalPrice), 0);

        const upcoming = active.filter((b) => {
            if (b.bookingDate > today) return true;
            if (b.bookingDate === today && b.endTime > nowHHMM) return true;
            return false;
        });

        const recent = active.slice(0, 3);

        return { total: bookings.length, upcoming: upcoming.length, totalSpent, recent };
    }, [bookings]);

    const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-ink-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-turf-300/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-turf-200/30 blur-3xl" />

            <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-turf-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-turf-700">
                        <UserIcon className="h-3.5 w-3.5" />
                        My Profile
                    </span>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                        Your{" "}
                        <span className="bg-gradient-to-r from-turf-600 to-turf-500 bg-clip-text text-transparent">
                            account
                        </span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex items-center gap-5">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-turf-400 to-turf-600 text-3xl font-extrabold text-white shadow-glow">
                                {initial}
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-xl font-extrabold text-ink-900">
                                    {user.name || "Player"}
                                </h2>
                                <p className="mt-0.5 truncate text-sm text-ink-500">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4 border-t border-ink-100 pt-6">
                            <InfoRow
                                icon={UserIcon}
                                label="Name"
                                value={user.name || "—"}
                            />
                            <InfoRow icon={Mail} label="Email" value={user.email} />
                            {user.createdAt && (
                                <InfoRow
                                    icon={Calendar}
                                    label="Member since"
                                    value={format(
                                        new Date(user.createdAt),
                                        "MMM d, yyyy"
                                    )}
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <StatBox
                            icon={Ticket}
                            label="Total bookings"
                            value={stats.total}
                            accent="from-turf-400 to-turf-600"
                        />
                        <StatBox
                            icon={Clock}
                            label="Upcoming"
                            value={stats.upcoming}
                            accent="from-sky-400 to-blue-600"
                        />
                        <StatBox
                            icon={Wallet}
                            label="Total spent"
                            value={formatBDT(stats.totalSpent)}
                            accent="from-pink-400 to-rose-600"
                        />
                    </div>
                </div>

                <div className="mt-6 rounded-3xl border border-ink-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-ink-100 p-5">
                        <div>
                            <h2 className="text-lg font-extrabold text-ink-900">
                                Recent bookings
                            </h2>
                            <p className="mt-0.5 text-xs text-ink-500">
                                Your last {stats.recent.length} booking
                                {stats.recent.length === 1 ? "" : "s"}
                            </p>
                        </div>
                        <Link
                            href="/bookings"
                            className="group inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-700 transition-all hover:border-turf-400 hover:bg-turf-50 hover:text-turf-700"
                        >
                            View all
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    {stats.recent.length === 0 ? (
                        <div className="p-10 text-center">
                            <Ticket className="mx-auto h-8 w-8 text-ink-300" />
                            <p className="mt-3 text-sm font-medium text-ink-500">
                                No bookings yet.
                            </p>
                            <Link
                                href="/book"
                                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500"
                            >
                                Book your first slot
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                        <ul className="divide-y divide-ink-100">
                            {stats.recent.map((b) => (
                                <li
                                    key={b.id}
                                    className="flex items-center justify-between gap-3 px-5 py-4"
                                >
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-turf-50 ring-1 ring-turf-100">
                                            <span className="text-[10px] font-bold uppercase text-turf-600/80">
                                                {format(new Date(b.bookingDate), "MMM d")}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-turf-700">
                                                {format12h(b.startTime)}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-ink-900">
                                                {b.pitchName}
                                            </p>
                                            <p className="truncate text-xs text-ink-500">
                                                {b.paymentStatus === "paid" ? (
                                                    <>
                                                        <CheckCircle2 className="mr-1 inline h-3 w-3 text-turf-500" />
                                                        Paid
                                                    </>
                                                ) : (
                                                    "Unpaid"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-extrabold text-turf-700">
                                        {formatBDT(b.totalPrice)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    {label}
                </p>
                <p className="truncate text-sm font-semibold text-ink-900">{value}</p>
            </div>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, accent }) {
    return (
        <div className="flex items-center gap-4 rounded-3xl border border-ink-200 bg-white p-4 shadow-sm">
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-glow`}
            >
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    {label}
                </p>
                <p className="truncate text-lg font-extrabold text-ink-900">{value}</p>
            </div>
        </div>
    );
}