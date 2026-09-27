// src/app/admin/_components/BookingsTable.jsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    X,
    Wallet,
    Smartphone,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
} from "lucide-react";
import {
    adminCancelBooking,
    adminMarkPaid,
} from "@/app/actions/admin";

function formatINR(v) {
    const n = Number(v);
    if (!n) return "₹0";
    return `₹${n.toLocaleString("en-IN")}`;
}

function StatusBadge({ status }) {
    const styles = {
        confirmed: "bg-turf-50 text-turf-700 ring-turf-200",
        cancelled: "bg-red-50 text-red-600 ring-red-200",
        pending: "bg-amber-50 text-amber-700 ring-amber-200",
    }[status] ?? "bg-ink-50 text-ink-600 ring-ink-200";

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${styles}`}
        >
            {status}
        </span>
    );
}

function PaymentBadge({ method, status }) {
    const Icon = method === "bkash" ? Smartphone : Wallet;
    const label = method === "bkash" ? "bKash" : "Cash";
    const paid = status === "paid";

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${paid
                    ? "bg-turf-50 text-turf-700"
                    : "bg-amber-50 text-amber-700"
                }`}
        >
            <Icon className="h-3 w-3" />
            {label} · {paid ? "Paid" : "Unpaid"}
        </span>
    );
}

export default function BookingsTable({ initialBookings, pitches }) {
    const [bookings, setBookings] = useState(initialBookings);
    const [isPending, startTransition] = useTransition();
    const [actionError, setActionError] = useState("");

    const [search, setSearch] = useState("");
    const [pitchFilter, setPitchFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const filtered = useMemo(() => {
        return bookings.filter((b) => {
            if (pitchFilter && b.pitchId !== pitchFilter) return false;
            if (statusFilter && b.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                const hay = `${b.userName} ${b.userEmail} ${b.pitchName} ${b.bookingDate} ${b.startTime}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [bookings, search, pitchFilter, statusFilter]);

    function handleCancel(id) {
        setActionError("");
        startTransition(async () => {
            try {
                await adminCancelBooking(id);
                setBookings((prev) =>
                    prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
                );
            } catch (err) {
                setActionError(err?.message ?? "Failed to cancel.");
            }
        });
    }

    function handleMarkPaid(id) {
        setActionError("");
        startTransition(async () => {
            try {
                await adminMarkPaid(id);
                setBookings((prev) =>
                    prev.map((b) =>
                        b.id === id ? { ...b, paymentStatus: "paid" } : b
                    )
                );
            } catch (err) {
                setActionError(err?.message ?? "Failed to mark paid.");
            }
        });
    }

    const hasFilters = search || pitchFilter || statusFilter;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-ink-200 bg-white p-4 shadow-sm">
                <div className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by user, pitch, date…"
                        className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                    />
                </div>

                <select
                    value={pitchFilter}
                    onChange={(e) => setPitchFilter(e.target.value)}
                    className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                >
                    <option value="">All pitches</option>
                    {pitches.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                >
                    <option value="">All statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                {hasFilters && (
                    <button
                        onClick={() => {
                            setSearch("");
                            setPitchFilter("");
                            setStatusFilter("");
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-50"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </button>
                )}
            </div>

            {actionError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{actionError}</span>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-ink-50 text-left text-[11px] font-bold uppercase tracking-wider text-ink-500">
                            <tr>
                                <th className="px-4 py-3">Slot</th>
                                <th className="px-4 py-3">Pitch</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Payment</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                            <AnimatePresence initial={false}>
                                {filtered.map((b) => (
                                    <motion.tr
                                        key={b.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-ink-50/50"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <p className="font-bold text-ink-900">
                                                {b.startTime} – {b.endTime}
                                            </p>
                                            <p className="text-xs text-ink-500">
                                                {format(new Date(b.bookingDate), "EEE, MMM d")}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-ink-800">
                                            {b.pitchName}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-ink-800">
                                                {b.userName}
                                            </p>
                                            <p className="text-xs text-ink-500">
                                                {b.userEmail}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <PaymentBadge
                                                method={b.paymentMethod}
                                                status={b.paymentStatus}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-turf-700">
                                            {formatINR(b.totalPrice)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {b.paymentStatus !== "paid" &&
                                                    b.status !== "cancelled" && (
                                                        <button
                                                            onClick={() => handleMarkPaid(b.id)}
                                                            disabled={isPending}
                                                            title="Mark as paid"
                                                            className="rounded-lg border border-ink-200 bg-white p-2 text-turf-600 transition-colors hover:border-turf-300 hover:bg-turf-50 disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                {b.status !== "cancelled" && (
                                                    <button
                                                        onClick={() => handleCancel(b.id)}
                                                        disabled={isPending}
                                                        title="Cancel booking"
                                                        className="rounded-lg border border-ink-200 bg-white p-2 text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="py-12 text-center">
                        <Search className="mx-auto h-8 w-8 text-ink-300" />
                        <p className="mt-3 text-sm font-medium text-ink-500">
                            No bookings match your filters.
                        </p>
                    </div>
                )}

                {isPending && (
                    <div className="flex items-center justify-center gap-2 border-t border-ink-100 py-2 text-xs text-ink-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating…
                    </div>
                )}
            </div>
        </div>
    );
}