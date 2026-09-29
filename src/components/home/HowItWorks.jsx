// src/components/home/HowItWorks.jsx
"use client";

import { motion } from "framer-motion";
import { Search, CalendarCheck, Smartphone } from "lucide-react";

const steps = [
    {
        icon: Search,
        title: "Pick a ground",
        description:
            "Browse our live grounds and pick the sport and slot that suits you.",
        accent: "from-turf-400 to-turf-600",
    },
    {
        icon: CalendarCheck,
        title: "Choose your slot",
        description:
            "See real-time availability for today and the next two days. Prices shown per slot.",
        accent: "from-emerald-400 to-turf-500",
    },
    {
        icon: Smartphone,
        title: "Pay with bKash",
        description:
            "Secure payment in seconds. Instant confirmation — no phone calls, no waiting.",
        accent: "from-lime-400 to-turf-500",
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.55, ease: "easeOut" },
    }),
};

export default function HowItWorks() {
    return (
        <section className="relative w-full overflow-hidden bg-ink-50 py-14 sm:py-20 lg:py-24">
            <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-turf-300/20 blur-3xl sm:h-96 sm:w-96" />

            <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={fadeUp}
                    custom={0}
                    className="mx-auto max-w-2xl text-center"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-turf-200 bg-white px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-turf-700 sm:px-4 sm:text-xs">
                        How it works
                    </span>
                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:mt-4 sm:text-3xl lg:text-4xl">
                        Book a slot in{" "}
                        <span className="bg-gradient-to-r from-turf-600 to-turf-500 bg-clip-text text-transparent">
                            three simple steps
                        </span>
                    </h2>
                    <p className="mt-2 text-sm text-ink-600 sm:mt-3 sm:text-base">
                        From picking a ground to kickoff in under a minute.
                    </p>
                </motion.div>

                <div className="relative mt-10 grid grid-cols-1 gap-8 sm:mt-14 sm:grid-cols-3 sm:gap-6">
                    <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-turf-300/0 via-turf-300 to-turf-300/0 sm:block" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={step.title}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={fadeUp}
                            custom={i + 1}
                            className="group relative w-full"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div
                                    className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${step.accent} shadow-glow transition-transform group-hover:scale-105 sm:h-24 sm:w-24`}
                                >
                                    <step.icon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-xs font-bold text-turf-600 shadow-md sm:h-8 sm:w-8 sm:text-sm">
                                        {i + 1}
                                    </span>
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-ink-900 sm:mt-6 sm:text-xl">
                                    {step.title}
                                </h3>
                                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-600 sm:mt-3">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}