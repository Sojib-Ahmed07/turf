// src/components/home/Footer.jsx
"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="relative overflow-hidden border-t border-ink-200 bg-ink-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-turf-300/20 blur-3xl sm:h-80 sm:w-80" />

            <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-turf-400 to-turf-600 shadow-glow">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-6 w-6 text-white"
                                >
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M12 4v16" />
                                    <circle cx="12" cy="12" r="2.5" />
                                    <path d="M2 9h3v6H2" />
                                    <path d="M22 9h-3v6h3" />
                                </svg>
                            </div>
                            <span className="text-lg font-extrabold tracking-tight text-ink-900">
                                Turf<span className="text-turf-600">Zone</span>
                            </span>
                        </Link>

                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
                            Book football, cricket, badminton, and swimming grounds across
                            Bangladesh. Real-time availability, transparent pricing, instant
                            confirmation via bKash.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-turf-700">
                            Quick links
                        </h4>
                        <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink-600">
                            <li>
                                <Link href="/" className="transition-colors hover:text-turf-700">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/book" className="transition-colors hover:text-turf-700">
                                    Book a slot
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/bookings"
                                    className="transition-colors hover:text-turf-700"
                                >
                                    My bookings
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/profile"
                                    className="transition-colors hover:text-turf-700"
                                >
                                    My profile
                                </Link>
                            </li>
                        </ul>

                        <div className="mt-5 space-y-2 text-sm text-ink-600">
                            <a
                                href="mailto:hello@turfzone.bd"
                                className="flex items-center gap-2 transition-colors hover:text-turf-700"
                            >
                                <Mail className="h-4 w-4 text-turf-500" />
                                hello@turfzone.bd
                            </a>
                            <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-turf-500" />
                                Bangladesh
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-200 pt-6 sm:flex-row">
                    <p className="text-xs text-ink-500">
                        © {year} TurfZone. All rights reserved.
                    </p>
                    <p className="text-xs text-ink-400">Made for players in Bangladesh 🇧🇩</p>
                </div>
            </div>
        </footer>
    );
}