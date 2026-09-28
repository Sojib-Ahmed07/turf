// src/app/admin/_components/SlotEditor.jsx
"use client";

import { useEffect, useState, useTransition } from "react";
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
    Coffee,
    Lock,
    Unlock,
} from "lucide-react";
import {
    getPitchBlocks,
    replacePitchBlocks,
    regeneratePitchBlocks,
} from "@/app/actions/admin";
import {
    applyResize,
    deleteBlock,
    convertToGap,
    convertToBookable,
    minutesBetween,
    format12h,
    deriveHours,
} from "@/lib/slots";

function formatBDT(v) {
    const n = Number(v);
    if (!n) return "৳0";
    return `৳${n.toFixed(0)}`;
}

export default function SlotEditor({ pitchId, onClose }) {
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [note, setNote] = useState("");
    const [meta, setMeta] = useState(null);
    const [blocks, setBlocks] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await getPitchBlocks(pitchId);
                if (cancelled) return;
                setMeta(res.pitch);
                setBlocks(res.blocks);
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

    function resize(index, delta) {
        setError("");
        setNote("");
        const res = applyResize(blocks, index, delta);
        setBlocks(res.blocks);
        if (res.note) setNote(res.note);
    }

    function toggleGap(index) {
        setError("");
        setNote("");
        setBlocks((prev) =>
            prev[index].isGap ? convertToBookable(prev, index) : convertToGap(prev, index)
        );
    }

    function remove(index) {
        setError("");
        setNote("");
        setBlocks((prev) => deleteBlock(prev, index));
    }

    function updatePrice(index, value) {
        setBlocks((prev) =>
            prev.map((b, i) => (i === index ? { ...b, price: value } : b))
        );
    }

    function handleRegenerate() {
        if (!confirm("Regenerate all blocks from the pitch's defaults? Manual edits will be lost.")) {
            return;
        }
        setError("");
        setNote("");
        startTransition(async () => {
            try {
                await regeneratePitchBlocks(pitchId);
                const res = await getPitchBlocks(pitchId);
                setMeta(res.pitch);
                setBlocks(res.blocks);
            } catch (err) {
                setError(err?.message ?? "Regeneration failed.");
            }
        });
    }

    function handleSave() {
        setError("");
        setNote("");
        startTransition(async () => {
            try {
                await replacePitchBlocks(pitchId, blocks);
                onClose?.();
            } catch (err) {
                setError(err?.message ?? "Save failed.");
            }
        });
    }

    const derived = blocks.length ? deriveHours(blocks) : null;

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
                    <div>
                        <h2 className="text-lg font-extrabold text-ink-900">Slot editor</h2>
                        {meta && (
                            <p className="mt-0.5 text-sm text-ink-500">
                                {meta.name} · {blocks.length} block
                                {blocks.length === 1 ? "" : "s"}
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
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
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

                    {!loading && blocks.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-10 text-center text-sm text-ink-500">
                            No blocks yet. Click &ldquo;Regenerate&rdquo; to build the default grid.
                        </div>
                    )}

                    {!loading && blocks.length > 0 && (
                        <div className="space-y-2">
                            {blocks.map((b, i) => {
                                const dur = minutesBetween(b.startTime, b.endTime);
                                return (
                                    <div
                                        key={b.id ?? `blk-${i}`}
                                        className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${b.isGap
                                                ? "border-dashed border-ink-300 bg-ink-50"
                                                : "border-ink-200 bg-white"
                                            }`}
                                    >
                                        <div className="flex min-w-[180px] items-center gap-2">
                                            {b.isGap ? (
                                                <Coffee className="h-4 w-4 text-ink-400" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-turf-500" />
                                            )}
                                            <span className="text-sm font-bold text-ink-900">
                                                {format12h(b.startTime)} – {format12h(b.endTime)}
                                            </span>
                                            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                                                {dur}m
                                            </span>
                                        </div>

                                        {!b.isGap && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-ink-500">৳</span>
                                                <input
                                                    type="number"
                                                    value={b.price}
                                                    onChange={(e) => updatePrice(i, e.target.value)}
                                                    className="w-24 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm font-semibold text-ink-900 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                                                />
                                            </div>
                                        )}

                                        <div className="ml-auto flex flex-wrap items-center gap-1.5">
                                            <button
                                                onClick={() => resize(i, -15)}
                                                disabled={dur <= 15}
                                                title="Shrink 15 min → creates a buffer"
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
                                                title="Shrink 30 min → creates a buffer"
                                                className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-[10px] font-bold text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-40"
                                            >
                                                −30m
                                            </button>
                                            <button
                                                onClick={() => toggleGap(i)}
                                                title={b.isGap ? "Make bookable" : "Make buffer"}
                                                className="rounded-lg border border-ink-200 bg-white p-1.5 text-ink-600 transition-colors hover:bg-ink-50"
                                            >
                                                {b.isGap ? (
                                                    <Unlock className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Lock className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => remove(i)}
                                                title="Delete block (merges into previous)"
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

                <div className="flex items-center gap-3 border-t border-ink-100 p-5">
                    <button
                        onClick={handleRegenerate}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                    </button>
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
                                Save blocks
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}