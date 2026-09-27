// components/Hero.jsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Star, Users, Trophy, Zap } from "lucide-react";

const stats = [
    { icon: MapPin, label: "Turfs Available", value: "250+" },
    { icon: Users, label: "Happy Players", value: "12K+" },
    { icon: Trophy, label: "Tournaments Hosted", value: "80+" },
    { icon: Star, label: "Average Rating", value: "4.9" },
];

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
};

const HERO_IMAGE =
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070&auto=format&fit=crop";

export default function Hero() {
    return (
        <section className="relative isolate overflow-hidden bg-ink-50">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src={HERO_IMAGE}
                    alt="Football turf"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.12),transparent_60%)]" />
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-4 pt-24 pb-28 sm:px-6 sm:pt-32 sm:pb-36 lg:px-8 lg:pt-40 lg:pb-44">
                <div className="mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-turf-200 bg-turf-50 px-4 py-1.5 text-xs font-medium text-turf-700 sm:text-sm"
                    >
                        <Zap className="h-3.5 w-3.5 fill-turf-500 text-turf-500" />
                        <span>Instant booking · No hidden fees</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="text-balance text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl lg:text-6xl xl:text-7xl"
                    >
                        Book Your{" "}
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-turf-600 via-turf-500 to-turf-600 bg-clip-text text-transparent">
                                Perfect Turf
                            </span>
                            <svg
                                className="absolute -bottom-2 left-0 h-3 w-full text-turf-400/70"
                                viewBox="0 0 300 12"
                                fill="none"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M2 8C50 2 150 2 298 6"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>{" "}
                        in Seconds
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="mx-auto mt-8 max-w-2xl text-pretty text-base leading-relaxed text-ink-600 sm:text-lg lg:text-xl"
                    >
                        Find and reserve premium football pitches near you — real-time
                        availability, transparent pricing, and instant confirmation.
                    </motion.p>
                </div>

                {/* Stats Row */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                    className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:mt-24 sm:grid-cols-4 sm:gap-6"
                >
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="group rounded-2xl border border-ink-200 bg-white p-4 text-center shadow-sm transition-all hover:border-turf-300 hover:shadow-md sm:p-5"
                        >
                            <stat.icon className="mx-auto mb-2 h-5 w-5 text-turf-500 transition-transform group-hover:scale-110" />
                            <div className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-ink-400">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Bottom fade */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </section>
    );
}