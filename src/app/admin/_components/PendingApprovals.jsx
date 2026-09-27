// src/app/admin/_components/PendingApprovals.jsx
"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    X,
    Wallet,
    Smartphone,
    AlertCircle,
    Loader2,
    Inbox,
} from "lucide-react";
import {
    adminApproveBooking,
    adminRejectBooking,
} from "@/app/actions/admin";

function formatINR(v) {
    const n = Number(v);
    if (!n) return "₹0";
    return `₹${n.toLocaleString("en-IN")}`;
}

export default function PendingApprovals({ initialPending }) {
    const [items, setItems] = useState(initialPending);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    function handleApprove(id) {
        setError("");
        startTransition(async () => {
            try {
                await adminApproveBooking(id);
                setItems((prev) => prev.filter((b) => b.id !== id));
            } catch (err) {
                setError(err?.message ?? "Failed to approve.");
            }
        });
    }

    function handleReject(id) {
        setError("");
        startTransition(async () => {
            try {
                await adminRejectBooking(id);
                setItems((prev) => prev.filter((b) => b.id !== id));
            } catch (err) {
                setError(err?.message ?? "Failed to reject.");
            }
        });
    }

    if (items.length === 0) {
        return (
            <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-turf-50 text-turf-600">
                        <Check className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-ink-900">
                            No pending approvals
                        </h2>
                        <p className="text-xs text-ink-500">
                            All cash bookings are up to date.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/40 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-200 p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Inbox className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-ink-900">
                            Pending approvals
                        </h2>
                        <p className="text-xs text-ink-500">
                            {items.length} cash booking{items.length === 1 ? "" : "s"} waiting
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <ul className="divide-y divide-amber-100">
                <AnimatePresence initial={false}>
                    {items.map((b) => (
                        <motion.li
                            key={b.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-ink-900">
                                        {b.pitchName}
                                    </p>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                        <Wallet className="h-3 w-3" />
                                        Cash
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-ink-500">
                                    {b.userName} · {b.userEmail}
                                </p>
                                <p className="mt-0.5 text-xs text-ink-500">
                                    {format(new Date(b.bookingDate), "EEE, MMM d")} ·{" "}
                                    {b.startTime} – {b.endTime}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="mr-2 text-sm font-extrabold text-turf-700">
                                    {formatINR(b.totalPrice)}
                                </span>
                                <button
                                    onClick={() => handleApprove(b.id)}
                                    disabled={isPending}
                                    title="Approve"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-turf-500 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-turf-600 disabled:opacity-50"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(b.id)}
                                    disabled={isPending}
                                    title="Reject"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reject
                                </button>
                            </div>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            {isPending && (
                <div className="flex items-center justify-center gap-2 border-t border-amber-200 py-2 text-xs text-ink-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating…
                </div>
            )}
        </div>
    );
}