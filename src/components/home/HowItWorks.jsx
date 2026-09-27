"use client";

import { motion } from "framer-motion";
import { Search, CalendarCheck, Trophy } from "lucide-react";

const steps = [
    { icon: Search, title: "Find Your Turf", description: "Search by location, date, and time. Browse verified pitches with real photos, pricing, and live availability.", accent: "from-turf-400 to-turf-600" },
    { icon: CalendarCheck, title: "Book Instantly", description: "Pick your slot, pay securely, and receive instant confirmation. No phone calls, no waiting, no hassle.", accent: "from-emerald-400 to-turf-500" },
    { icon: Trophy, title: "Play & Enjoy", description: "Show up, play, and leave the admin to us. Reschedule anytime and earn rewards with every match.", accent: "from-lime-400 to-turf-500" },
];

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" } }),
};

export default function HowItWorks() {
    return (
        <section className="relative overflow-hidden bg-ink-50 py-20 sm:py-28">
            <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-turf-300/20 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}
                    variants={fadeUp} custom={0} className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-turf-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-turf-700">
                        How It Works
                    </span>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
                        Book a turf in{" "}
                        <span className="bg-gradient-to-r from-turf-600 to-turf-500 bg-clip-text text-transparent">
                            three simple steps
                        </span>
                    </h2>
                    <p className="mt-4 text-base text-ink-600 sm:text-lg">From search to kickoff in under a minute.</p>
                </motion.div>

                <div className="relative mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
                    <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-turf-300/0 via-turf-300 to-turf-300/0 sm:block" />

                    {steps.map((step, i) => (
                        <motion.div key={step.title} initial="hidden" whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }} variants={fadeUp} custom={i + 1}
                            className="group relative">
                            <div className="flex flex-col items-center text-center">
                                <div className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${step.accent} shadow-glow transition-transform group-hover:scale-105`}>
                                    <step.icon className="h-10 w-10 text-white" />
                                    <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-sm font-bold text-turf-600 shadow-md">
                                        {i + 1}
                                    </span>
                                </div>
                                <h3 className="mt-6 text-xl font-bold text-ink-900">{step.title}</h3>
                                <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-600">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}