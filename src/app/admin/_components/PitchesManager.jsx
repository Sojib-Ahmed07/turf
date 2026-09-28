// src/app/admin/_components/PitchesManager.jsx
"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Pencil,
    Power,
    X,
    Loader2,
    AlertCircle,
    Image as ImageIcon,
    SlidersHorizontal,
} from "lucide-react";
import { togglePitchActive, upsertPitch } from "@/app/actions/admin";
import { hourOptions, formatHour12 } from "@/lib/slots";
import SlotEditor from "./SlotEditor";

const SPORTS = [
    { value: "football", label: "Football" },
    { value: "cricket", label: "Cricket" },
    { value: "badminton", label: "Badminton" },
    { value: "swimming_pool", label: "Swimming Pool" },
];

function formatBDT(v) {
    const n = Number(v);
    if (!n) return "৳0";
    return `৳${n.toFixed(0)}`;
}

const HOURS = hourOptions();

const EMPTY_FORM = {
    id: null,
    name: "",
    description: "",
    sport: "football",
    hourlyRate: "",
    openHour: 6,
    closeHour: 3,
    defaultSlotMinutes: 90,
    imageUrl: "",
    isActive: true,
};

export default function PitchesManager({ initialPitches }) {
    const [pitches, setPitches] = useState(initialPitches);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(null);
    const [editingSlotsFor, setEditingSlotsFor] = useState(null);

    function openNew() {
        setEditing({ ...EMPTY_FORM });
    }

    function openEdit(pitch) {
        setEditing({
            id: pitch.id,
            name: pitch.name,
            description: pitch.description ?? "",
            sport: pitch.sport,
            hourlyRate: pitch.hourlyRate,
            openHour: pitch.openHour,
            closeHour: pitch.closeHour,
            defaultSlotMinutes: pitch.defaultSlotMinutes,
            imageUrl: pitch.imageUrl ?? "",
            isActive: pitch.isActive,
        });
    }

    function closeModal() {
        if (isPending) return;
        setEditing(null);
        setError("");
    }

    function handleToggle(id) {
        setError("");
        startTransition(async () => {
            try {
                const res = await togglePitchActive(id);
                setPitches((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, isActive: res.isActive } : p))
                );
            } catch (err) {
                setError(err?.message ?? "Failed to toggle pitch.");
            }
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!editing) return;
        setError("");

        startTransition(async () => {
            try {
                await upsertPitch({
                    id: editing.id,
                    name: editing.name.trim(),
                    description: editing.description.trim() || null,
                    sport: editing.sport,
                    hourlyRate: editing.hourlyRate,
                    openHour: Number(editing.openHour),
                    closeHour: Number(editing.closeHour),
                    defaultSlotMinutes: Number(editing.defaultSlotMinutes),
                    imageUrl: editing.imageUrl.trim() || null,
                    isActive: editing.isActive,
                });

                if (editing.id) {
                    setPitches((prev) =>
                        prev.map((p) =>
                            p.id === editing.id
                                ? {
                                    ...p,
                                    name: editing.name,
                                    description: editing.description,
                                    sport: editing.sport,
                                    hourlyRate: String(editing.hourlyRate),
                                    openHour: Number(editing.openHour),
                                    closeHour: Number(editing.closeHour),
                                    defaultSlotMinutes: Number(editing.defaultSlotMinutes),
                                    imageUrl: editing.imageUrl || null,
                                    isActive: editing.isActive,
                                }
                                : p
                        )
                    );
                } else {
                    window.location.reload();
                }
                setEditing(null);
            } catch (err) {
                setError(err?.message ?? "Failed to save pitch.");
            }
        });
    }

    return (
        <>
            <div className="flex justify-end">
                <button
                    onClick={openNew}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    Add ground
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pitches.map((p) => (
                    <div
                        key={p.id}
                        className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all ${p.isActive
                                ? "border-ink-200 hover:border-turf-300 hover:shadow-md"
                                : "border-ink-200 opacity-70"
                            }`}
                    >
                        <div className="relative h-32 bg-gradient-to-br from-turf-100 to-turf-50">
                            {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-turf-400" />
                                </div>
                            )}
                            <span className="absolute right-3 top-3 rounded-full bg-ink-900/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                {SPORTS.find((s) => s.value === p.sport)?.label ?? p.sport}
                            </span>
                            <span
                                className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${p.isActive ? "bg-turf-500 text-white" : "bg-ink-800/80 text-white"
                                    }`}
                            >
                                {p.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>

                        <div className="p-5">
                            <h3 className="truncate text-base font-bold text-ink-900">{p.name}</h3>
                            <p className="mt-0.5 line-clamp-2 h-9 text-xs text-ink-500">
                                {p.description || "No description"}
                            </p>

                            <p className="mt-3 text-[11px] font-semibold text-ink-500">
                                {formatHour12(p.openHour)} → {formatHour12(p.closeHour)} ·{" "}
                                {p.defaultSlotMinutes}m slots
                            </p>

                            <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                                <div>
                                    <p className="text-lg font-extrabold text-turf-700">
                                        {formatBDT(p.hourlyRate)}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wider text-ink-400">
                                        base / hour
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setEditingSlotsFor(p.id)}
                                        title="Manage slots"
                                        className="rounded-lg border border-turf-200 bg-turf-50 p-2 text-turf-700 transition-colors hover:bg-turf-100"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleToggle(p.id)}
                                        disabled={isPending}
                                        title={p.isActive ? "Deactivate" : "Activate"}
                                        className={`rounded-lg border p-2 transition-colors disabled:opacity-50 ${p.isActive
                                                ? "border-turf-200 bg-turf-50 text-turf-700 hover:bg-turf-100"
                                                : "border-ink-200 bg-white text-ink-500 hover:bg-ink-50"
                                            }`}
                                    >
                                        <Power className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => openEdit(p)}
                                        disabled={isPending}
                                        title="Edit"
                                        className="rounded-lg border border-ink-200 bg-white p-2 text-ink-600 transition-colors hover:border-turf-300 hover:bg-turf-50 disabled:opacity-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {pitches.length === 0 && (
                    <div className="col-span-full rounded-3xl border border-dashed border-ink-300 bg-white p-12 text-center">
                        <p className="text-sm text-ink-500">
                            No grounds yet. Click &ldquo;Add ground&rdquo; to create one.
                        </p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 backdrop-blur-sm sm:items-center"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 40, opacity: 0, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 320, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-ink-200 bg-white shadow-2xl sm:rounded-3xl"
                        >
                            <form onSubmit={handleSubmit}>
                                <div className="flex items-start justify-between border-b border-ink-100 p-5">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-ink-900">
                                            {editing.id ? "Edit ground" : "New ground"}
                                        </h2>
                                        <p className="mt-0.5 text-sm text-ink-500">
                                            Fill in the details below.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 p-5">
                                    <Field
                                        label="Name"
                                        value={editing.name}
                                        onChange={(v) => setEditing({ ...editing, name: v })}
                                        required
                                        placeholder="Ground A — 5v5"
                                    />
                                    <Field
                                        label="Description"
                                        value={editing.description}
                                        onChange={(v) => setEditing({ ...editing, description: v })}
                                        placeholder="Indoor turf, 5-a-side"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                                                Sport
                                            </label>
                                            <select
                                                value={editing.sport}
                                                onChange={(e) =>
                                                    setEditing({ ...editing, sport: e.target.value })
                                                }
                                                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                                            >
                                                {SPORTS.map((s) => (
                                                    <option key={s.value} value={s.value}>
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <Field
                                            label="Base rate (৳/hour)"
                                            type="number"
                                            value={editing.hourlyRate}
                                            onChange={(v) => setEditing({ ...editing, hourlyRate: v })}
                                            required
                                            placeholder="1000"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                                                Opens at
                                            </label>
                                            <select
                                                value={editing.openHour}
                                                onChange={(e) =>
                                                    setEditing({
                                                        ...editing,
                                                        openHour: Number(e.target.value),
                                                    })
                                                }
                                                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                                            >
                                                {HOURS.map((h) => (
                                                    <option key={h.value} value={h.value}>
                                                        {h.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                                                Closes at
                                            </label>
                                            <select
                                                value={editing.closeHour}
                                                onChange={(e) =>
                                                    setEditing({
                                                        ...editing,
                                                        closeHour: Number(e.target.value),
                                                    })
                                                }
                                                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                                            >
                                                {HOURS.map((h) => (
                                                    <option key={h.value} value={h.value}>
                                                        {h.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <Field
                                            label="Default slot (min)"
                                            type="number"
                                            value={editing.defaultSlotMinutes}
                                            onChange={(v) =>
                                                setEditing({ ...editing, defaultSlotMinutes: v })
                                            }
                                            required
                                            placeholder="90"
                                        />
                                    </div>

                                    <p className="-mt-2 text-[11px] text-ink-500">
                                        Business day runs from{" "}
                                        <span className="font-semibold text-turf-700">
                                            {formatHour12(editing.openHour)} →{" "}
                                            {formatHour12(editing.closeHour)}
                                        </span>
                                        . If the close hour is earlier than the open hour, the day
                                        crosses midnight (e.g. 6 AM → 3 AM).
                                    </p>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                                            Status
                                        </label>
                                        <select
                                            value={editing.isActive ? "1" : "0"}
                                            onChange={(e) =>
                                                setEditing({
                                                    ...editing,
                                                    isActive: e.target.value === "1",
                                                })
                                            }
                                            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
                                        >
                                            <option value="1">Active</option>
                                            <option value="0">Inactive</option>
                                        </select>
                                    </div>

                                    <Field
                                        label="Image URL"
                                        value={editing.imageUrl}
                                        onChange={(v) => setEditing({ ...editing, imageUrl: v })}
                                        placeholder="https://…"
                                    />

                                    {!editing.id && (
                                        <p className="rounded-xl border border-turf-100 bg-turf-50 px-3 py-2 text-[11px] text-turf-700">
                                            Saving will auto-generate a default slot grid using the
                                            default duration. You can fine-tune it from
                                            &ldquo;Manage slots&rdquo;.
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 border-t border-ink-100 p-5">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={isPending}
                                        className="flex-1 rounded-2xl border border-ink-200 bg-white px-5 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving…
                                            </>
                                        ) : editing.id ? (
                                            "Save changes"
                                        ) : (
                                            "Create ground"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingSlotsFor && (
                    <SlotEditor
                        key="slot-editor"
                        pitchId={editingSlotsFor}
                        onClose={() => setEditingSlotsFor(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                placeholder={placeholder}
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-turf-400 focus:outline-none focus:ring-2 focus:ring-turf-100"
            />
        </div>
    );
}