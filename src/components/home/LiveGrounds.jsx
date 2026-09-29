// src/components/home/LiveGrounds.jsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight,
    CalendarCheck,
    Image as ImageIcon,
    MapPin,
    Sparkles,
} from "lucide-react";

const SPORT_LABEL = {
    football: "Football",
    cricket: "Cricket",
    badminton: "Badminton",
    swimming_pool: "Swimming Pool",
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
};

function formatBDT(v) {
    const n = Number(v);
    if (!n) return "৳0";
    return `৳${n.toFixed(0)}`;
}

export default function LiveGrounds({ pitches = [] }) {
    const grounds = pitches.slice(0, 3);

    return (
        <section
            id="grounds"
            className="relative w-full overflow-hidden bg-white py-14 sm:py-20 lg:py-24"
        >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={fadeUp}
                    custom={0}
                    className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between"
                >
                    <div className="max-w-xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-turf-200 bg-turf-50 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-turf-700 sm:px-4 sm:text-xs">
                            <Sparkles className="h-3 w-3" />
                            Available grounds
                        </span>
                        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:mt-4 sm:text-3xl lg:text-4xl">
                            Pick a ground,{" "}
                            <span className="bg-gradient-to-r from-turf-600 to-turf-500 bg-clip-text text-transparent">
                                book a slot
                            </span>
                        </h2>
                        <p className="mt-2 text-sm text-ink-600 sm:mt-3 sm:text-base">
                            Every ground has its own slots, prices, and hours.
                        </p>
                    </div>
                    <Link
                        href="/book"
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-all hover:border-turf-400 hover:bg-turf-50 hover:text-turf-700 sm:w-auto"
                    >
                        Book a slot
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>

                {/* Empty state */}
                {grounds.length === 0 && (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={1}
                        className="mt-8 rounded-3xl border border-dashed border-ink-300 bg-ink-50 p-8 text-center sm:mt-12 sm:p-14"
                    >
                        <MapPin className="mx-auto h-8 w-8 text-turf-500" />
                        <h3 className="mt-4 text-lg font-bold text-ink-900">
                            Grounds coming soon
                        </h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
                            We&apos;re setting up the first grounds. Check back soon — you&apos;ll
                            be able to book in seconds.
                        </p>
                    </motion.div>
                )}

                {/* Ground cards */}
                {grounds.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                        {grounds.map((g, i) => (
                            <motion.article
                                key={g.id}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                variants={fadeUp}
                                custom={i + 1}
                                className="group flex w-full flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-turf-300 hover:shadow-xl hover:shadow-turf-500/10"
                            >
                                <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-turf-100 to-turf-50 sm:h-52">
                                    {g.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={g.imageUrl}
                                            alt={g.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <ImageIcon className="h-10 w-10 text-turf-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent" />
                                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-turf-700 shadow-sm backdrop-blur-sm">
                                        {SPORT_LABEL[g.sport] ?? g.sport}
                                    </span>
                                </div>

                                <div className="flex flex-1 flex-col p-4 sm:p-5">
                                    <h3 className="truncate text-base font-bold text-ink-900 sm:text-lg">
                                        {g.name}
                                    </h3>
                                    {g.description && (
                                        <p className="mt-1 line-clamp-2 text-xs text-ink-500 sm:text-sm">
                                            {g.description}
                                        </p>
                                    )}

                                    <div className="mt-3 flex items-center gap-3 border-t border-ink-100 pt-3 text-[11px] text-ink-600">
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-turf-500" />
                                            Base {formatBDT(g.hourlyRate)}/hr
                                        </span>
                                    </div>

                                    <Link
                                        href={`/book?pitchId=${g.id}`}
                                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-4 py-2.5 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-[0.98]"
                                    >
                                        <CalendarCheck className="h-4 w-4" />
                                        Book this ground
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}