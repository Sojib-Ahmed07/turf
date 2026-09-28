// src/app/book/BookingClient.jsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar as CalendarIcon,
    Clock,
    AlertCircle,
    Loader2,
    MapPin,
    X,
    Smartphone,
    ShieldCheck,
    Moon,
} from "lucide-react";
import { startBkashBooking } from "@/app/actions/bkash-payment";
import { toDateKey } from "@/lib/time";
import { format12h } from "@/lib/slots";

const DAYS_AHEAD = 30;

const SPORT_LABEL = {
    football: "Football",
    cricket: "Cricket",
    badminton: "Badminton",
    swimming_pool: "Swimming Pool",
};

function buildDateRange() {
    const today = startOfDay(new Date());
    const days = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
        const d = addDays(today, i);
        days.push({
            date: d,
            key: toDateKey(d),
            label: format(d, "d"),
            weekday: format(d, "EEE"),
            month: format(d, "MMM"),
        });
    }
    return days;
}

function formatBDT(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return "৳0";
    return `৳${n.toFixed(0)}`;
}

export default function BookingClient({ pitches, user }) {
    const [isPending, startTransition] = useTransition();
    const days = useMemo(() => buildDateRange(), []);

    const [selectedPitchId, setSelectedPitchId] = useState(pitches[0]?.id ?? "");
    const [selectedDateKey, setSelectedDateKey] = useState(days[0].key);
    const [blocks, setBlocks] = useState([]);
    const [bookedSet, setBookedSet] = useState(new Set());
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState("");

    const [pendingBlock, setPendingBlock] = useState(null);
    const [modalError, setModalError] = useState("");

    const selectedPitch = pitches.find((p) => p.id === selectedPitchId);

    const slots = useMemo(() => {
        const today = new Date();
        const todayKey = toDateKey(today);
        const nowMins = today.getHours() * 60 + today.getMinutes();
        const isToday = selectedDateKey === todayKey;
        const isPastDay = selectedDateKey < todayKey;

        return blocks.map((b) => {
            const startMins = Number(b.startTime.slice(0, 2)) * 60 + Number(b.startTime.slice(3, 5));
            const isPostMidnight = startMins < 6 * 60;
            const isBooked = bookedSet.has(b.startTime);
            const isPast =
                isPastDay ||
                (isToday && !isPostMidnight && startMins <= nowMins);
            return {
                ...b,
                crossesMidnight: b.startTime >= "23:00" || isPostMidnight,
                isBooked,
                isPast,
                isBookable: !b.isGap && !isBooked && !isPast,
            };
        });
    }, [blocks, selectedDateKey, bookedSet]);

    useEffect(() => {
        if (!selectedPitchId || !selectedDateKey) return;
        let cancelled = false;

        (async () => {
            setLoadingSlots(true);
            setError("");
            try {
                const res = await fetch(
                    `/api/booked-slots?pitchId=${selectedPitchId}&date=${selectedDateKey}`,
                    { cache: "no-store" }
                );
                if (!res.ok) throw new Error("Failed to load slots");
                const data = await res.json();
                if (cancelled) return;
                setBlocks(data.blocks ?? []);
                setBookedSet(new Set(data.startTimes ?? []));
            } catch (err) {
                if (cancelled) return;
                console.error(err);
                setError("Could not load availability. Please try again.");
                setBlocks([]);
                setBookedSet(new Set());
            } finally {
                if (!cancelled) setLoadingSlots(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedPitchId, selectedDateKey]);

    function openModal(slot) {
        setPendingBlock(slot);
        setModalError("");
    }

    function closeModal() {
        if (isPending) return;
        setPendingBlock(null);
        setModalError("");
    }

    function handleConfirm() {
        if (!pendingBlock || !selectedPitch) return;
        setModalError("");

        startTransition(async () => {
            try {
                const { bkashURL } = await startBkashBooking({
                    pitchId: selectedPitchId,
                    timeBlockId: pendingBlock.id,
                    bookingDate: selectedDateKey,
                });
                window.location.href = bkashURL;
            } catch (err) {
                console.error(err);
                setModalError(err?.message ?? "Could not start payment.");
            }
        });
    }

    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-ink-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-turf-300/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-turf-200/30 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-turf-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-turf-700">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Book a Slot
                    </span>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                        Hi {user.name?.split(" ")[0] || "player"}, pick your{" "}
                        <span className="bg-gradient-to-r from-turf-600 to-turf-500 bg-clip-text text-transparent">
                            perfect slot
                        </span>
                    </h1>
                    <p className="mt-2 text-sm text-ink-600 sm:text-base">
                        Choose a ground, date and slot — pay securely via bKash.
                    </p>
                </motion.div>

                {error && (
                    <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-500">
                                <MapPin className="h-4 w-4 text-turf-500" />
                                Choose Ground
                            </h2>
                            <div className="space-y-2">
                                {pitches.map((p) => {
                                    const active = p.id === selectedPitchId;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPitchId(p.id)}
                                            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${active
                                                    ? "border-turf-400 bg-turf-50 ring-2 ring-turf-200"
                                                    : "border-ink-200 bg-white hover:border-turf-300 hover:bg-turf-50/50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-bold text-ink-900">
                                                    {p.name}
                                                </p>
                                                <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-600">
                                                    {SPORT_LABEL[p.sport] ?? p.sport}
                                                </span>
                                            </div>
                                            {p.description && (
                                                <p className="mt-0.5 truncate text-xs text-ink-500">
                                                    {p.description}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-500">
                                <CalendarIcon className="h-4 w-4 text-turf-500" />
                                Choose Date
                            </h2>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {days.slice(0, 14).map((d) => {
                                    const active = d.key === selectedDateKey;
                                    return (
                                        <button
                                            key={d.key}
                                            onClick={() => setSelectedDateKey(d.key)}
                                            className={`flex min-w-[64px] flex-col items-center rounded-2xl border px-3 py-2.5 transition-all ${active
                                                    ? "border-turf-400 bg-turf-500 text-white shadow-glow"
                                                    : "border-ink-200 bg-white text-ink-700 hover:border-turf-300 hover:bg-turf-50"
                                                }`}
                                        >
                                            <span
                                                className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-white/80" : "text-ink-400"
                                                    }`}
                                            >
                                                {d.weekday}
                                            </span>
                                            <span className="mt-0.5 text-lg font-extrabold leading-none">
                                                {d.label}
                                            </span>
                                            <span
                                                className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${active ? "text-white/80" : "text-ink-400"
                                                    }`}
                                            >
                                                {d.month}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink-900">
                                    <Clock className="h-5 w-5 text-turf-500" />
                                    {format(new Date(selectedDateKey), "EEEE, MMMM d")}
                                </h2>
                                {selectedPitch && (
                                    <p className="mt-0.5 text-sm text-ink-500">
                                        {selectedPitch.name}
                                    </p>
                                )}
                            </div>
                            {loadingSlots && (
                                <span className="flex items-center gap-1.5 text-xs text-ink-500">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Loading availability…
                                </span>
                            )}
                        </div>

                        {!loadingSlots && slots.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-10 text-center text-sm text-ink-500">
                                No slots configured for this ground yet.
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            {slots.map((slot) => {
                                if (slot.isGap) {
                                    return (
                                        <div
                                            key={`gap-${slot.id}`}
                                            className="flex flex-col items-start justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-3.5 py-3 text-left"
                                        >
                                            <span className="text-sm font-bold text-ink-400">
                                                {format12h(slot.startTime)} – {format12h(slot.endTime)}
                                            </span>
                                            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                                                Buffer
                                            </span>
                                        </div>
                                    );
                                }

                                const disabled = !slot.isBookable || loadingSlots;
                                const base =
                                    "group relative flex flex-col items-start justify-center rounded-2xl border px-3.5 py-3 text-left transition-all";
                                let cls =
                                    "border-ink-200 bg-white text-ink-700 hover:border-turf-400 hover:bg-turf-50 hover:shadow-sm";
                                if (slot.isBooked)
                                    cls =
                                        "border-red-200 bg-red-50 text-red-600 cursor-not-allowed";
                                else if (slot.isPast)
                                    cls =
                                        "border-ink-100 bg-ink-50 text-ink-400 cursor-not-allowed";
                                else if (disabled)
                                    cls =
                                        "border-ink-200 bg-white text-ink-400 cursor-not-allowed";

                                return (
                                    <button
                                        key={slot.id}
                                        disabled={disabled}
                                        onClick={() => openModal(slot)}
                                        className={`${base} ${cls}`}
                                    >
                                        <div className="flex w-full items-center justify-between gap-2">
                                            <span className="text-sm font-bold">
                                                {format12h(slot.startTime)} – {format12h(slot.endTime)}
                                            </span>
                                            {slot.crossesMidnight && (
                                                <Moon className="h-3.5 w-3.5 opacity-60" />
                                            )}
                                        </div>
                                        <div className="mt-1 flex w-full items-center justify-between">
                                            {slot.isBooked && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    Booked
                                                </span>
                                            )}
                                            {slot.isPast && !slot.isBooked && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    Past
                                                </span>
                                            )}
                                            {slot.isBookable && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-turf-600 opacity-0 transition-opacity group-hover:opacity-100">
                                                    Book →
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-turf-700">
                                                {formatBDT(slot.price)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-ink-100 pt-4 text-[11px] text-ink-500">
                            <LegendDot className="border border-ink-200 bg-white" label="Available" />
                            <LegendDot className="border border-red-200 bg-red-50" label="Booked" />
                            <LegendDot className="border border-ink-100 bg-ink-50" label="Past" />
                            <LegendDot
                                className="border border-dashed border-ink-200 bg-ink-50/60"
                                label="Buffer"
                            />
                            <span className="inline-flex items-center gap-1.5">
                                <Moon className="h-3 w-3 text-ink-400" />
                                Crosses midnight
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {pendingBlock && selectedPitch && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 backdrop-blur-sm sm:items-center"
                        onClick={closeModal}
                    >
                        <motion.div
                            key="modal"
                            initial={{ y: 40, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 40, opacity: 0, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 320, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-ink-200 bg-white shadow-2xl sm:rounded-3xl"
                        >
                            <div className="flex items-start justify-between border-b border-ink-100 p-5 sm:p-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-ink-900">
                                        Confirm your booking
                                    </h2>
                                    <p className="mt-0.5 text-sm text-ink-500">
                                        Pay {formatBDT(pendingBlock.price)} via bKash to confirm.
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    disabled={isPending}
                                    className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 disabled:opacity-50"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-5 p-5 sm:p-6">
                                <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-sm">
                                    <Row label="Ground" value={selectedPitch.name} />
                                    <Row
                                        label="Sport"
                                        value={SPORT_LABEL[selectedPitch.sport] ?? selectedPitch.sport}
                                    />
                                    <Row
                                        label="Date"
                                        value={format(new Date(selectedDateKey), "EEE, MMM d, yyyy")}
                                    />
                                    <Row
                                        label="Time"
                                        value={`${format12h(pendingBlock.startTime)} – ${format12h(pendingBlock.endTime)}`}
                                    />
                                    {pendingBlock.crossesMidnight && (
                                        <Row label="Note" value="Ends after midnight" />
                                    )}
                                    <Row
                                        label="Total"
                                        value={formatBDT(pendingBlock.price)}
                                        highlight
                                    />
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl border border-pink-200 bg-pink-50 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-500 text-white">
                                        <Smartphone className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-ink-900">bKash</p>
                                        <p className="text-[11px] text-ink-500">
                                            You&apos;ll be redirected to complete the payment.
                                        </p>
                                    </div>
                                </div>

                                {modalError && (
                                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>{modalError}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-[11px] text-ink-400">
                                    <ShieldCheck className="h-3.5 w-3.5 text-turf-500" />
                                    Secure payment powered by bKash.
                                </div>
                            </div>

                            <div className="flex gap-3 border-t border-ink-100 p-5 sm:p-6">
                                <button
                                    onClick={closeModal}
                                    disabled={isPending}
                                    className="flex-1 rounded-2xl border border-ink-200 bg-white px-5 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isPending}
                                    className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-pink-400 hover:to-pink-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Redirecting…
                                        </>
                                    ) : (
                                        <>
                                            <Smartphone className="h-4 w-4" />
                                            Pay {formatBDT(pendingBlock.price)} with bKash
                                        </>
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

function Row({ label, value, highlight = false }) {
    return (
        <div className="flex items-center justify-between border-b border-ink-100 py-1.5 last:border-0">
            <span className="text-ink-500">{label}</span>
            <span className={highlight ? "font-extrabold text-turf-700" : "font-semibold text-ink-900"}>
                {value}
            </span>
        </div>
    );
}

function LegendDot({ className, label }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-full ${className}`} />
            {label}
        </span>
    );
}