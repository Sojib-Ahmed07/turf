// src/app/admin/_components/AdminShell.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    CalendarDays,
    MapPin,
    Menu,
    X,
    ArrowLeft,
} from "lucide-react";

const NAV = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
    { label: "Pitches", href: "/admin/pitches", icon: MapPin },
];

export default function AdminShell({ user, children }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const isActive = (item) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href);

    const close = () => setOpen(false);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-ink-50">
            <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* ---------- Desktop sidebar ---------- */}
                <aside className="hidden w-60 shrink-0 lg:block">
                    <div className="sticky top-24 rounded-3xl border border-ink-200 bg-white p-4 shadow-sm">
                        <div className="mb-4 border-b border-ink-100 pb-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                                Signed in as
                            </p>
                            <p className="mt-1 truncate text-sm font-bold text-ink-900">
                                {user.name}
                            </p>
                            <p className="truncate text-xs text-ink-500">{user.email}</p>
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-turf-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-turf-700">
                                Admin
                            </span>
                        </div>

                        <nav className="space-y-1">
                            {NAV.map((item) => {
                                const active = isActive(item);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active
                                                ? "bg-turf-50 text-turf-700 ring-1 ring-turf-200"
                                                : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-4 border-t border-ink-100 pt-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-500 transition-colors hover:text-turf-700"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to site
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* ---------- Mobile top bar ---------- */}
                <div className="fixed inset-x-0 top-16 z-30 border-b border-ink-200 bg-white/90 backdrop-blur-sm lg:hidden">
                    <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm font-bold text-ink-900">Admin</span>
                        <button
                            onClick={() => setOpen(true)}
                            className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-100"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile spacer */}
                <div className="h-12 lg:hidden" />

                {/* ---------- Mobile drawer ---------- */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
                            onClick={close}
                        >
                            <motion.aside
                                initial={{ x: -280 }}
                                animate={{ x: 0 }}
                                exit={{ x: -280 }}
                                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-full w-72 bg-white p-5 shadow-2xl"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <span className="text-lg font-extrabold text-ink-900">
                                        Admin menu
                                    </span>
                                    <button
                                        onClick={close}
                                        className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <nav className="space-y-1">
                                    {NAV.map((item) => {
                                        const active = isActive(item);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={close}
                                                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${active
                                                        ? "bg-turf-50 text-turf-700 ring-1 ring-turf-200"
                                                        : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                                                    }`}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </nav>

                                <div className="mt-6 border-t border-ink-100 pt-4">
                                    <Link
                                        href="/"
                                        onClick={close}
                                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-500 transition-colors hover:text-turf-700"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Back to site
                                    </Link>
                                </div>
                            </motion.aside>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ---------- Main ---------- */}
                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}