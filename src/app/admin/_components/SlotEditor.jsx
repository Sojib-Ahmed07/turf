// src/app/admin/_components/SlotEditor.jsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
    X,
    Loader2,
    AlertCircle,
    Plus,
    Minus,
    Trash2,
    RefreshCw,
    Save,
    Clock,
    RotateCcw,
    Copy,
} from "lucide-react";
import {
    getPitchBlocksEditorData,
    replaceDefaultBlocks,
    replaceDateBlocks,
    resetDateToDefault,
    regenerateDefaultBlocks,
    seedDateFromDefault,
} from "@/app/actions/admin";
import {
    applyResize,
    deleteBlock,
    minutesBetween,
    format12h,
    deriveHours,
} from "@/lib/slots";

/* ---- date label helpers ---- */

function startOfToday() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
}

/** Short chip label: "Sat 12" / "Today" / "Tomorrow" */
function formatDayChip(dateKey) {
    const d = new Date(dateKey + "T00:00:00");
    const today = startOfToday();
    const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));

    const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
    const dayNum = d.getDate();

    if (diffDays === 0) return `Today · ${dayNum}`;
    if (diffDays === 1) return `Tomorrow · ${dayNum}`;
    if (diffDays === 2) return `Day after · ${dayNum}`;
    return `${weekday} · ${dayNum}`;
}

/** Longer label for the header under the title. */
function formatDayLong(dateKey) {
    const d = new Date(dateKey + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function SlotEditor({ pitchId, onClose }) {
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [note, setNote] = useState("");
    const [meta, setMeta] = useState(null);
    const [defaultBlocks, setDefaultBlocks] = useState([]);
    const [days, setDays] = useState([]);
    const [activeTab, setActiveTab] = useState("default"); // "default" or a dateKey

    /* Horizontal day strip — keep the selected chip in view. */
    const stripRef = useRef(null);
    useEffect(() => {
        if (activeTab === "default") return;
        const strip = stripRef.current;
        if (!strip) return;
        const el = strip.querySelector(`[data-tab="${activeTab}"]`);
        if (el) {
            el.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
            });
        }
    }, [activeTab]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await getPitchBlocksEditorData(pitchId);
                if (cancelled) return;
                setMeta(res.pitch);
                setDefaultBlocks(res.defaultBlocks);
                setDays(res.days);
            } catch (err) {
                if (!cancelled) setError(err?.message ?? "Failed to load blocks.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [pitchId]);

    const isDefaultTab = activeTab === "default";
    const activeDay = isDefaultTab ? null : days.find((d) => d.date === activeTab);
    const currentBlocks = isDefaultTab ? defaultBlocks : activeDay?.blocks ?? [];

    function setCurrentBlocks(updater) {
        if (isDefaultTab) {
            setDefaultBlocks((prev) =>
                typeof updater === "function" ? updater(prev) : updater
            );
        } else {
            setDays((prev) =>
                prev.map((d) =>
                    d.date === activeTab
                        ? {
                            ...d,
                            blocks:
                                typeof updater === "function"
                                    ? updater(d.blocks)
                                    : updater,
                        }
                        : d
                )
            );
        }
    }

    function resize(index, delta) {
        setError("");
        setNote("");
        const res = applyResize(currentBlocks, index, delta);
        setCurrentBlocks(res.blocks);
        if (res.note) setNote(res.note);
    }

    function remove(index) {
        setError("");
        setNote("");
        setCurrentBlocks((prev) => deleteBlock(prev, index));
    }

    function updatePrice(index, value) {
        setCurrentBlocks((prev) =>
            prev.map((b, i) => (i === index ? { ...b, price: value } : b))
        );
    }

    function handleRegenerateDefault() {
        if (!confirm("Regenerate the DEFAULT schedule from the pitch's hours? Manual edits will be lost.")) {
            return;
        }
        setError("");
        setNote("");
        startTransition(async () => {
            try {
                await regenerateDefaultBlocks(pitchId);
                const res = await getPitchBlocksEditorData(pitchId);
                setMeta(res.pitch);
                setDefaultBlocks(res.defaultBlocks);
                setDays(res.days);
            } catch (err) {
                setError(err?.message ?? "Regeneration failed.");
            }
        });
    }

    function handleSeedDateFromDefault() {
        if (!activeDay) return;
        if (
            !confirm(
                `Copy the default schedule into ${activeDay.date}? This will overwrite the current blocks for that date.`
            )
        ) {
            return;
        }
        setError("");
        setNote("");
        startTransition(async () => {
            try {
                await seedDateFromDefault(pitchId, activeDay.date);
                const res = await getPitchBlocksEditorData(pitchId);
                setMeta(res.pitch);
                setDefaultBlocks(res.defaultBlocks);
                setDays(res.days);
            } catch (err) {
                setError(err?.message ?? "Failed to copy default.");
            }
        });
    }

    function handleResetDate() {
        if (!activeDay) return;
        if (!confirm(`Remove the override for ${activeDay.date} and use the default?`)) {
            return;
        }
        setError("");
        setNote("");
        startTransition(async () => {
            try {
                await resetDateToDefault(pitchId, activeDay.date);
                const res = await getPitchBlocksEditorData(pitchId);
                setMeta(res.pitch);
                setDefaultBlocks(res.defaultBlocks);
                setDays(res.days);
            } catch (err) {
                setError(err?.message ?? "Reset failed.");
            }
        });
    }

    function handleSave() {
        setError("");
        setNote("");
        startTransition(async () => {
            try {
                if (isDefaultTab) {
                    await replaceDefaultBlocks(pitchId, defaultBlocks);
                } else if (activeDay) {
                    await replaceDateBlocks(pitchId, activeDay.date, activeDay.blocks);
                }
                onClose?.();
            } catch (err) {
                setError(err?.message ?? "Save failed.");
            }
        });
    }

    const derived = currentBlocks.length ? deriveHours(currentBlocks) : null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 backdrop-blur-sm sm:items-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-ink-200 bg-white shadow-2xl sm:rounded-3xl"
            >
                <div className="flex items-start justify-between border-b border-ink-100 p-5">
                    <div className="min-w-0">
                        <h2 className="text-lg font-extrabold text-ink-900">Slot editor</h2>
                        {meta && (
                            <p className="mt-0.5 truncate text-sm text-ink-500">
                                {meta.name} · {currentBlocks.length} block
                                {currentBlocks.length === 1 ? "" : "s"}
                                {derived && (
                                    <>
                                        {" · "}
                                        <span className="font-semibold text-turf-700">
                                            {String(derived.openHour).padStart(2, "0")}:00 →{" "}
                                            {String(derived.closeHour).padStart(2, "0")}:00
                                        </span>
                                    </>
                                )}
                            </p>
                        )}
                        {!isDefaultTab && activeDay && (
                            <p className="mt-0.5 truncate text-xs font-semibold text-ink-400">
                                {formatDayLong(activeDay.date)}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tab strip: Default + horizontally scrollable day chips */}
                <div className="border-b border-ink-100 bg-ink-50/60">
                    <div className="flex items-center gap-2 px-5 pt-3">
                        <button
                            onClick={() => {
                                setActiveTab("default");
                                setNote("");
                                setError("");
                            }}
                            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${isDefaultTab
                                ? "bg-turf-500 text-white shadow-glow"
                                : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-turf-50 hover:text-turf-700"
                                }`}
                        >
                            Default schedule
                        </button>
                        <span className="shrink-0 text-ink-300">|</span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                            Next 30 days
                        </span>
                    </div>

                    <div
                        ref={stripRef}
                        className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:thin]"
                    >
                        {days.map((d) => {
                            const active = !isDefaultTab && d.date === activeTab;
                            return (
                                <button
                                    key={d.date}
                                    data-tab={d.date}
                                    onClick={() => {
                                        setActiveTab(d.date);
                                        setNote("");
                                        setError("");
                                    }}
                                    className={`flex shrink-0 snap-start items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${active
                                        ? "bg-turf-500 text-white shadow-glow"
                                        : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-turf-50 hover:text-turf-700"
                                        }`}
                                >
                                    <span className="whitespace-nowrap">
                                        {formatDayChip(d.date)}
                                    </span>
                                    {d.isOverride && (
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${active
                                                ? "bg-white/25 text-white"
                                                : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            Custom
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-turf-500" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && note && (
                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {note}
                        </div>
                    )}

                    {!loading && currentBlocks.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-10 text-center text-sm text-ink-500">
                            {isDefaultTab ? (
                                <>
                                    No default blocks yet. Click &ldquo;Regenerate&rdquo; to
                                    build the template.
                                </>
                            ) : (
                                <>
                                    This day has no blocks. Click &ldquo;Copy default&rdquo;
                                    to start from the template, or add blocks from the
                                    Default tab.
                                </>
                            )}
                        </div>
                    )}

                    {!loading && currentBlocks.length > 0 && (
                        <div className="space-y-2">
                            {currentBlocks.map((b, i) => {
                                const dur = minutesBetween(b.startTime, b.endTime);
                                return (
                                    <div
                                        key={b.id ?? `blk-${i}`}
                                        className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
                                    >
                                        <div className="flex min-w-[180px] items-center gap-2">
                                            <Clock className="h-4 w-4 text-turf-500" />
                                            <span className="text-sm font-bold text-ink-900">
                                                {format12h(b.startTime)} – {format12h(b.endTime)}
                                            </span>
                                            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                                                {dur}m
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-ink-500">৳</span>
                                            <input
                                                type="number"
                                                value={b.price}
                                                onChange={(e) => updatePrice(i, e.target.value)}
                                                className="w-24 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm font-semibold text-ink-900 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                                            />
                                        </div>

                                        <div className="ml-auto flex flex-wrap items-center gap-1.5">
                                            <button
                                                onClick={() => resize(i, -15)}
                                                disabled={dur <= 15}
                                                title="Shrink 15 min"
                                                className="rounded-lg border border-ink-200 bg-white p-1.5 text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-40"
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => resize(i, 15)}
                                                title="Extend 15 min"
                                                className="rounded-lg border border-ink-200 bg-white p-1.5 text-ink-600 transition-colors hover:bg-ink-50"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => resize(i, 30)}
                                                title="Extend 30 min"
                                                className="rounded-lg border border-turf-200 bg-turf-50 px-2 py-1.5 text-[10px] font-bold text-turf-700 transition-colors hover:bg-turf-100"
                                            >
                                                +30m
                                            </button>
                                            <button
                                                onClick={() => resize(i, -30)}
                                                disabled={dur <= 30}
                                                title="Shrink 30 min"
                                                className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-[10px] font-bold text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-40"
                                            >
                                                −30m
                                            </button>
                                            <button
                                                onClick={() => remove(i)}
                                                title="Delete block"
                                                className="rounded-lg border border-red-200 bg-white p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 p-5">
                    {isDefaultTab ? (
                        <button
                            onClick={handleRegenerateDefault}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Regenerate
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSeedDateFromDefault}
                                disabled={isPending}
                                className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
                            >
                                <Copy className="h-4 w-4" />
                                Copy default
                            </button>
                            <button
                                onClick={handleResetDate}
                                disabled={isPending || !activeDay?.isOverride}
                                className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-40"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset to default
                            </button>
                        </>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-2xl border border-ink-200 bg-white px-5 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                {isDefaultTab ? "Save default" : "Save day"}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}