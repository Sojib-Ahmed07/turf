"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Star, Users, ArrowRight, Clock } from "lucide-react";

const turfs = [
    {
        id: 1, name: "Green Arena 5-a-side", location: "Downtown, Mumbai", price: 1200, rating: 4.9, reviews: 214, capacity: "10 players", open: "6:00 AM – 11:00 PM",
        image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1200&auto=format&fit=crop", tag: "Popular"
    },
    {
        id: 2, name: "Night Lights 7-a-side", location: "Andheri West, Mumbai", price: 1800, rating: 4.8, reviews: 168, capacity: "14 players", open: "24 hours",
        image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1200&auto=format&fit=crop", tag: "Floodlit"
    },
    {
        id: 3, name: "Champions Turf — 11-a-side", location: "Powai, Mumbai", price: 2500, rating: 4.9, reviews: 302, capacity: "22 players", open: "5:00 AM – 12:00 AM",
        image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=1200&auto=format&fit=crop", tag: "Premium"
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" } }),
};

export default function FeaturedTurfs() {
    return (
        <section className="relative bg-white py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}
                    variants={fadeUp} custom={0}
                    className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-turf-200 bg-turf-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-turf-700">
                            Featured Turfs
                        </span>
                        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
                            Top-rated pitches{" "}
                            <span className="bg-gradient-to-r from-turf-600 to-turf-500 bg-clip-text text-transparent">
                                near you
                            </span>
                        </h2>
                        <p className="mt-4 text-base text-ink-600 sm:text-lg">Hand-picked, verified, and loved by thousands of players.</p>
                    </div>
                    <Link href="/turfs"
                        className="group inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition-all hover:border-turf-400 hover:bg-turf-50 hover:text-turf-700">
                        View all turfs
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>

                <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {turfs.map((turf, i) => (
                        <motion.article key={turf.id} initial="hidden" whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={i + 1}
                            className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-turf-300 hover:shadow-xl hover:shadow-turf-500/10">
                            <div className="relative h-52 w-full overflow-hidden">
                                <Image src={turf.image} alt={turf.name} fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent" />

                                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-turf-700 shadow-sm backdrop-blur-sm">
                                    {turf.tag}
                                </span>

                                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 shadow-sm backdrop-blur-sm">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    <span className="text-xs font-bold text-ink-900">{turf.rating}</span>
                                    <span className="text-[10px] text-ink-500">({turf.reviews})</span>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                                <h3 className="text-lg font-bold text-ink-900">{turf.name}</h3>
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                                    <MapPin className="h-3.5 w-3.5 text-turf-500" />
                                    {turf.location}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3 border-t border-ink-100 pt-4 text-xs text-ink-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-turf-500" />
                                        {turf.capacity}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-turf-500" />
                                        {turf.open}
                                    </span>
                                </div>

                                <div className="mt-5 flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-extrabold text-ink-900">₹{turf.price}</span>
                                        <span className="text-xs text-ink-500"> / hour</span>
                                    </div>
                                    <Link href={`/turfs/${turf.id}`}
                                        className="rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-4 py-2 text-xs font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-95">
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}