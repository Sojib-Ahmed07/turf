// src/components/home/Navbar.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    Home,
    CalendarCheck,
    Calendar,
    LogIn,
    UserPlus,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import UserMenu from "@/components/UserMenu";

const navLinks = [
    { name: "Home", href: "/", icon: Home, exact: true },
    { name: "Book", href: "/book", icon: CalendarCheck },
    { name: "My Bookings", href: "/bookings", icon: Calendar },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { data: session, isPending } = useSession();
    const user = session?.user;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const closeMenu = () => setIsOpen(false);

    const isActive = (link) =>
        link.exact ? pathname === link.href : pathname.startsWith(link.href);

    // Where to send the user back after login/register.
    // Don't send them back to /login or /register themselves.
    const callbackUrl =
        pathname && pathname !== "/login" && pathname !== "/register"
            ? pathname
            : "/";
    const encodedCallback = encodeURIComponent(callbackUrl);

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                ? "border-b border-ink-200 bg-white/90 shadow-sm shadow-ink-900/5 backdrop-blur-md"
                : "border-b border-transparent bg-white"
                }`}
        >
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link
                    href="/"
                    onClick={closeMenu}
                    className="group flex shrink-0 items-center gap-2"
                >
                    <motion.div
                        whileHover={{ rotate: 12, scale: 1.08 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-turf-400 to-turf-600 shadow-glow sm:h-10 sm:w-10"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-white sm:h-6 sm:w-6"
                        >
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M12 4v16" />
                            <circle cx="12" cy="12" r="2.5" />
                            <path d="M2 9h3v6H2" />
                            <path d="M22 9h-3v6h3" />
                        </svg>
                    </motion.div>
                    <span className="text-base font-extrabold tracking-tight text-ink-900 sm:text-lg">
                        Turf<span className="text-turf-600">Zone</span>
                    </span>
                </Link>

                {/* Desktop links */}
                <ul className="hidden items-center gap-1 md:flex">
                    {navLinks.map((link) => {
                        const active = isActive(link);
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${active
                                        ? "text-turf-700"
                                        : "text-ink-600 hover:text-ink-900"
                                        }`}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.name}
                                    {active && (
                                        <motion.span
                                            layoutId="active-pill"
                                            className="absolute inset-0 -z-10 rounded-lg bg-turf-50 ring-1 ring-turf-200"
                                            transition={{
                                                type: "spring",
                                                stiffness: 380,
                                                damping: 30,
                                            }}
                                        />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Right side */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    {isPending ? (
                        <div className="hidden h-10 w-10 animate-pulse rounded-full bg-ink-100 sm:block" />
                    ) : user ? (
                        <UserMenu />
                    ) : (
                        <>
                            <Link
                                href={`/login?callbackUrl=${encodedCallback}`}
                                className="hidden items-center gap-2 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 transition-all hover:border-turf-400 hover:bg-turf-50 hover:text-turf-700 sm:flex"
                            >
                                <LogIn className="h-4 w-4" />
                                Sign in
                            </Link>
                            <Link
                                href={`/register?callbackUrl=${encodedCallback}`}
                                className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-95 sm:flex"
                            >
                                <UserPlus className="h-4 w-4" />
                                Sign up
                            </Link>
                        </>
                    )}

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

            {/* Mobile drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="w-full overflow-hidden border-t border-ink-200 bg-white md:hidden"
                    >
                        <ul className="space-y-1 px-4 py-4">
                            {navLinks.map((link, i) => {
                                const active = isActive(link);
                                return (
                                    <motion.li
                                        key={link.href}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={closeMenu}
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors ${active
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

                        <div className="flex flex-col gap-3 border-t border-ink-200 px-4 py-4">
                            {isPending ? (
                                <div className="h-12 animate-pulse rounded-full bg-ink-100" />
                            ) : user ? (
                                <>
                                    <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
                                        <p className="truncate text-sm font-bold text-ink-900">
                                            {user.name || "Player"}
                                        </p>
                                        <p className="truncate text-xs text-ink-500">
                                            {user.email}
                                        </p>
                                    </div>
                                    <Link
                                        href="/profile"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-full border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                                    >
                                        My Profile
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={`/register?callbackUrl=${encodedCallback}`}
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-3 text-sm font-semibold text-white shadow-glow active:scale-95"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Create account
                                    </Link>
                                    <Link
                                        href={`/login?callbackUrl=${encodedCallback}`}
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