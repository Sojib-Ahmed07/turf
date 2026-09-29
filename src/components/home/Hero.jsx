// src/components/home/Hero.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck, MapPin, ArrowRight, Zap } from "lucide-react";

const HERO_IMAGE =
    "https://res.cloudinary.com/dlefye5fi/image/upload/v1790662326/Gemini_Generated_Image_7qawl37qawl37qaw_zsuafr.jpg";

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.55, ease: "easeOut" },
    }),
};

export default function Hero() {
    return (
        <section className="relative isolate w-full overflow-hidden bg-ink-50">
            {/* Background — overflow-hidden keeps the grid pattern inside */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <Image
                    src={HERO_IMAGE}
                    alt="Football turf"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.14),transparent_60%)]" />
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>

            {/* Content */}
            <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-32 lg:pb-36">
                <div className="mx-auto max-w-3xl text-center">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-turf-200 bg-turf-50 px-3.5 py-1.5 text-[11px] font-medium text-turf-700 sm:mb-6 sm:px-4 sm:text-sm"
                    >
                        <Zap className="h-3.5 w-3.5 fill-turf-500 text-turf-500" />
                        <span>Instant booking · Pay with bKash</span>
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="text-balance text-[28px] font-extrabold leading-[1.15] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl"
                    >
                        Book your{" "}
                        <span className="bg-gradient-to-r from-turf-600 via-turf-500 to-turf-600 bg-clip-text text-transparent">
                            perfect ground
                        </span>{" "}
                        in seconds
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-ink-600 sm:mt-6 sm:text-lg"
                    >
                        Football, cricket, badminton, swimming — real-time availability,
                        transparent prices, instant confirmation.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={3}
                        className="mt-7 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center"
                    >
                        <Link
                            href="/book"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-[0.98] sm:w-auto sm:px-7 sm:py-4 sm:text-base"
                        >
                            <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                            Book a slot
                        </Link>
                        <Link
                            href="#grounds"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-3.5 text-sm font-bold text-ink-700 transition-all hover:border-turf-300 hover:bg-turf-50 hover:text-turf-700 sm:w-auto sm:px-7 sm:py-4 sm:text-base"
                        >
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                            See grounds
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>

                    {/* Trust line */}
                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={4}
                        className="mt-6 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400 sm:mt-8 sm:text-xs"
                    >
                        Trusted by players across Bangladesh
                    </motion.p>
                </div>
            </div>

            {/* Bottom fade */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent sm:h-24" />
        </section>
    );
}