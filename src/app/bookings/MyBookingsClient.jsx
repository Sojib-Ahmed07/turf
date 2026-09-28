// src/app/bookings/MyBookingsClient.jsx
"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarDays,
    Clock,
    MapPin,
    Smartphone,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Search,
    ArrowRight,
    Ticket,
} from "lucide-react";
import { cancelBooking } from "@/app/actions/booking";
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

function classify(b) {
    if (b.status === "cancelled") return "cancelled";

    const today = todayKeyLocal();
    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const isPastDate = b.bookingDate < today;
    const isToday = b.bookingDate === today;
    const endedToday = isToday && b.endTime <= nowHHMM;

    if (isPastDate || endedToday) return "past";
    return "upcoming";
}

function StatusPill({ booking }) {
    if (booking.status === "cancelled") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 ring-1 ring-red-200">
                <XCircle className="h-3 w-3" />
                Cancelled
            </span>
        );
    }
    if (booking.paymentStatus === "paid") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-turf-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-turf-700 ring-1 ring-turf-200">
                <CheckCircle2 className="h-3 w-3" />
                Confirmed
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
            <Clock className="h-3 w-3" />
            Pending
        </span>
    );
}

export default function MyBookingsClient({ initialBookings, user }) {
    const [bookings, setBookings] = useState(initialBookings);
    const [tab, setTab] = useState("upcoming");
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();
    const [actionError, setActionError] = useState("");
    const [confirmingCancel, setConfirmingCancel] = useState(null);

    const categorized = useMemo(() => {
        const buckets = { upcoming: [], past: [], cancelled: [] };
        for (const b of bookings) buckets[classify(b)].push(b);
        return buckets;
    }, [bookings]);

    const counts = {
        upcoming: categorized.upcoming.length,
        past: categorized.past.length,
        cancelled: categorized.cancelled.length,
    };

    const visible = useMemo(() => {
        const list = categorized[tab] ?? [];
        if (!search) return list;
        const q = search.toLowerCase();
        return list.filter((b) =>
            `${b.pitchName} ${b.bookingDate} ${b.startTime} ${b.bkashTrxID ?? ""}`
                .toLowerCase()
                .includes(q)
        );
    }, [categorized, tab, search]);

    const totalSpent = useMemo(() => {
        return bookings
            .filter((b) => b.paymentStatus === "paid" && b.status !== "cancelled")
            .reduce((sum, b) => sum + Number(b.totalPrice), 0);
    }, [bookings]);

    function handleCancel(id) {
        setActionError("");
        startTransition(async () => {
            try {
                await cancelBooking(id);
                setBookings((prev) =>
                    prev.map((b) =>
                        b.id === id ? { ...b, status: "cancelled" } : b
                    )
                );
                setConfirmingCancel(null);
            } catch (err) {
                setActionError(err?.message ?? "Failed to cancel.");
            }
        });
    }

    const TABS = [
        { key: "upcoming", label: "Upcoming", count: counts.upcoming },
        { key: "past", label: "Past", count: counts.past },
        { key: "cancelled", label: "Cancelled", count: counts.cancelled },
    ];

    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-ink-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-turf-300/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-turf-200/30 blur-3xl" />

            <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-turf-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-turf-700">
                        <Ticket className="h-3.5 w-3.5" />
                        My Bookings
                    </span>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                        Hi {user.name?.split(" ")[0] || "player"}, here are your{" "}
                        <span className="bg-gradient-to-r from-turf-600 to-turf-500 bg-clip-text text-transparent">
                            bookings
                        </span>
                    </h1>
                    <p className="mt-2 text-sm text-ink-600">
                        Total spent: {formatBDT(totalSpent)} · {bookings.length} booking
                        {bookings.length === 1 ? "" : "s"}
                    </p>
                </div>

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-ink-200 bg-white p-1 shadow-sm">
                        {TABS.map((t) => {
                            const active = tab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${active
                                            ? "bg-turf-500 text-white shadow-glow"
                                            : "text-ink-600 hover:bg-turf-50 hover:text-turf-700"
                                        }`}
                                >
                                    {t.label}
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${active
                                                ? "bg-white/25 text-white"
                                                : "bg-ink-100 text-ink-500"
                                            }`}
                                    >
                                        {t.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by pitch, date, TrxID…"
                            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                        />
                    </div>
                </div>

                {actionError && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{actionError}</span>
                    </div>
                )}

                {visible.length === 0 ? (
                    <EmptyState tab={tab} />
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {visible.map((b) => (
                                <BookingCard
                                    key={b.id}
                                    b={b}
                                    onCancel={() => setConfirmingCancel(b.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {confirmingCancel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 px-4 backdrop-blur-sm"
                        onClick={() => !isPending && setConfirmingCancel(null)}
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-3xl border border-ink-200 bg-white p-6 shadow-2xl"
                        >
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h2 className="mt-4 text-center text-lg font-extrabold text-ink-900">
                                Cancel this booking?
                            </h2>
                            <p className="mt-1 text-center text-sm text-ink-500">
                                The slot will be released for others. Paid amount is not
                                refunded automatically.
                            </p>
                            <div className="mt-6 flex gap-2">
                                <button
                                    onClick={() => setConfirmingCancel(null)}
                                    disabled={isPending}
                                    className="flex-1 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
                                >
                                    Keep
                                </button>
                                <button
                                    onClick={() => handleCancel(confirmingCancel)}
                                    disabled={isPending}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-70"
                                >
                                    {isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Yes, cancel"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BookingCard({ b, onCancel }) {
    const isUpcoming = classify(b) === "upcoming";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-turf-400 to-turf-600 text-white shadow-glow">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                            {format(new Date(b.bookingDate), "MMM")}
                        </span>
                        <span className="text-2xl font-extrabold leading-none">
                            {format(new Date(b.bookingDate), "d")}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                            {format(new Date(b.bookingDate), "EEE")}
                        </span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-ink-900">
                                {b.pitchName}
                            </h3>
                            <StatusPill booking={b} />
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-turf-500" />
                                {format12h(b.startTime)} – {format12h(b.endTime)}
                            </span>
                            {b.pitchDescription && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-turf-500" />
                                    {b.pitchDescription}
                                </span>
                            )}
                        </div>

                        {b.bkashTrxID && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1 text-[11px]">
                                <Smartphone className="h-3 w-3 text-pink-500" />
                                <span className="text-ink-500">TrxID:</span>
                                <span className="font-mono font-semibold text-ink-800">
                                    {b.bkashTrxID}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-4 sm:flex-col sm:items-end sm:border-none sm:pt-0">
                    <div className="text-right">
                        <p className="text-xl font-extrabold text-turf-700">
                            {formatBDT(b.totalPrice)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-ink-400">
                            {b.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </p>
                    </div>

                    {isUpcoming && (
                        <button
                            onClick={onCancel}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function EmptyState({ tab }) {
    const config = {
        upcoming: {
            icon: CalendarDays,
            title: "No upcoming bookings",
            subtitle: "Ready to play? Book your next slot.",
            cta: true,
        },
        past: {
            icon: Clock,
            title: "No past bookings yet",
            subtitle: "Your completed games will appear here.",
        },
        cancelled: {
            icon: XCircle,
            title: "No cancelled bookings",
            subtitle: "Cancelled bookings will appear here.",
        },
    }[tab];

    const Icon = config.icon;

    return (
        <div className="rounded-3xl border border-ink-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50">
                <Icon className="h-7 w-7 text-ink-400" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-ink-900">
                {config.title}
            </h3>
            <p className="mt-1 text-sm text-ink-500">{config.subtitle}</p>

            {config.cta && (
                <Link
                    href="/book"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500"
                >
                    Book a slot
                    <ArrowRight className="h-4 w-4" />
                </Link>
            )}
        </div>
    );
}