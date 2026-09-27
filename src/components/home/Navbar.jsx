// src/components/Navbar.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    Calendar,
    User,
    MapPin,
    Trophy,
    Info,
    Home,
    LogIn,
    UserPlus,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import UserMenu from "@/components/UserMenu";

const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Turfs", href: "/turfs", icon: MapPin },
    { name: "Tournaments", href: "/tournaments", icon: Trophy },
    { name: "About", href: "/about", icon: Info },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { data: session, isPending } = useSession();

    const user = session?.user;

    /* ✅ Valid effect: window scroll subscription */
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    /* ✅ Valid effect: sync React state → document.body */
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const closeMenu = () => setIsOpen(false);

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                    ? "bg-white/90 backdrop-blur-md shadow-md shadow-ink-900/5 border-b border-ink-200"
                    : "bg-white border-b border-transparent"
                }`}
        >
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                {/* ---------- Logo ---------- */}
                <Link href="/" onClick={closeMenu} className="group flex items-center gap-2">
                    <motion.div
                        whileHover={{ rotate: 12, scale: 1.08 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-turf-400 to-turf-600 shadow-glow"
                    >
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
                    </motion.div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-lg font-extrabold tracking-tight text-ink-900">
                            Turf<span className="text-turf-600">Zone</span>
                        </span>
                        <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400 sm:block">
                            Book · Play · Repeat
                        </span>
                    </div>
                </Link>

                {/* ---------- Desktop Links ---------- */}
                <ul className="hidden items-center gap-1 md:flex">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive
                                            ? "text-turf-700"
                                            : "text-ink-600 hover:text-ink-900"
                                        }`}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.name}
                                    {isActive && (
                                        <motion.span
                                            layoutId="active-pill"
                                            className="absolute inset-0 -z-10 rounded-lg bg-turf-50 ring-1 ring-turf-200"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* ---------- Right Actions ---------- */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {isPending ? (
                        /* Loading skeleton */
                        <div className="hidden h-10 w-10 animate-pulse rounded-full bg-ink-100 sm:block" />
                    ) : user ? (
                        /* ---------- Logged in: icon-only profile ---------- */
                        <UserMenu />
                    ) : (
                        /* ---------- Logged out: Sign in + Sign up ---------- */
                        <>
                            <Link
                                href="/login"
                                className="hidden items-center gap-2 rounded-full border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 transition-all hover:border-turf-400 hover:bg-turf-50 hover:text-turf-700 sm:flex"
                            >
                                <LogIn className="h-4 w-4" />
                                Sign in
                            </Link>
                            <Link
                                href="/register"
                                className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 hover:shadow-[0_0_35px_rgba(34,197,94,0.45)] active:scale-95 sm:flex"
                            >
                                <UserPlus className="h-4 w-4" />
                                Sign up
                            </Link>
                        </>
                    )}

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setIsOpen((v) => !v)}
                        aria-label="Toggle menu"
                        aria-expanded={isOpen}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-ink-100 md:hidden"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {isOpen ? (
                                <motion.span
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <X className="h-6 w-6" />
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Menu className="h-6 w-6" />
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </nav>

            {/* ---------- Mobile Menu ---------- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-ink-200 bg-white md:hidden"
                    >
                        <ul className="space-y-1 px-4 py-4">
                            {navLinks.map((link, i) => {
                                const isActive = pathname === link.href;
                                return (
                                    <motion.li
                                        key={link.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={closeMenu}
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors ${isActive
                                                    ? "bg-turf-50 text-turf-700 ring-1 ring-turf-200"
                                                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                                                }`}
                                        >
                                            <link.icon className="h-5 w-5" />
                                            {link.name}
                                        </Link>
                                    </motion.li>
                                );
                            })}
                        </ul>

                        {/* Mobile CTAs — text only, no image */}
                        <div className="flex flex-col gap-3 border-t border-ink-200 px-4 py-4">
                            {isPending ? (
                                <div className="h-12 animate-pulse rounded-full bg-ink-100" />
                            ) : user ? (
                                <>
                                    {/* User info — text only */}
                                    <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
                                        <p className="truncate text-sm font-bold text-ink-900">
                                            {user.name || "Player"}
                                        </p>
                                        <p className="truncate text-xs text-ink-500">
                                            {user.email}
                                        </p>
                                    </div>

                                    <Link
                                        href="/book"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-3 text-sm font-semibold text-white shadow-glow active:scale-95"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        Book Now
                                    </Link>
                                    <Link
                                        href="/profile"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-full border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                                    >
                                        <User className="h-4 w-4" />
                                        My Profile
                                    </Link>
                                    <Link
                                        href="/bookings"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-full border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        My Bookings
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/register"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-3 text-sm font-semibold text-white shadow-glow active:scale-95"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Create account
                                    </Link>
                                    <Link
                                        href="/login"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-full border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}