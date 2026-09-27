// src/components/UserMenu.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    CalendarDays,
    LogOut,
    LayoutDashboard,
    Settings,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export default function UserMenu() {
    const { data: session, isPending } = useSession();
    const [open, setOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const menuRef = useRef(null);
    const router = useRouter();

    const user = session?.user;
    const isAdmin = user?.role === "admin";

    /* ✅ Valid effect: subscribe to outside-click (external → React state) */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* ✅ Valid effect: subscribe to Escape key */
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const close = () => setOpen(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        setOpen(false);
        await signOut();
        router.push("/");
        router.refresh();
    };

    /* Loading — small pulse circle */
    if (isPending) {
        return <div className="h-10 w-10 animate-pulse rounded-full bg-ink-100" />;
    }

    /* Not logged in → render nothing (Navbar handles Sign in / Sign up) */
    if (!user) return null;

    const menuItems = [
        { label: "My Profile", href: "/profile", icon: User },
        { label: "My Bookings", href: "/bookings", icon: CalendarDays },
        ...(isAdmin
            ? [{ label: "Admin Dashboard", href: "/admin", icon: LayoutDashboard }]
            : []),
        { label: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <div className="relative" ref={menuRef}>
            {/* ---------- Icon-only trigger ---------- */}
            <button
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Open profile menu"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${open
                        ? "border-turf-400 bg-turf-50 text-turf-700"
                        : "border-ink-200 bg-white text-ink-600 hover:border-turf-400 hover:bg-turf-50 hover:text-turf-700"
                    }`}
            >
                <User className="h-5 w-5" />
            </button>

            {/* ---------- Dropdown ---------- */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl shadow-ink-900/10"
                        role="menu"
                    >
                        {/* User header (text only, no image) */}
                        <div className="border-b border-ink-100 bg-gradient-to-br from-turf-50 to-white p-4">
                            <p className="truncate text-sm font-bold text-ink-900">
                                {user.name || "Player"}
                            </p>
                            <p className="truncate text-xs text-ink-500">{user.email}</p>
                            {isAdmin && (
                                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-turf-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-turf-700">
                                    Admin
                                </span>
                            )}
                        </div>

                        {/* Menu items */}
                        <ul className="p-2">
                            {menuItems.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        role="menuitem"
                                        onClick={close}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-turf-50 hover:text-turf-700"
                                    >
                                        <item.icon className="h-4 w-4 text-ink-400" />
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* Sign out */}
                        <div className="border-t border-ink-100 p-2">
                            <button
                                onClick={handleSignOut}
                                disabled={signingOut}
                                role="menuitem"
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                            >
                                {signingOut ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                                        Signing out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}