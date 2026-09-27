"use client";

import Link from "next/link";
import {
    Globe, Camera, MessageCircle, PlayCircle,
    Mail, Phone, MapPin, ArrowUpRight,
} from "lucide-react";

const footerLinks = {
    Company: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Press", href: "/press" },
        { name: "Blog", href: "/blog" },
    ],
    Players: [
        { name: "Find Turfs", href: "/turfs" },
        { name: "Tournaments", href: "/tournaments" },
        { name: "My Bookings", href: "/bookings" },
        { name: "Rewards", href: "/rewards" },
    ],
    Owners: [
        { name: "List Your Turf", href: "/list-turf" },
        { name: "Pricing", href: "/pricing" },
        { name: "Dashboard", href: "/owner" },
        { name: "Support", href: "/support" },
    ],
    Legal: [
        { name: "Terms of Service", href: "/terms" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "Refund Policy", href: "/refunds" },
    ],
};

const socials = [
    { icon: Globe, href: "https://facebook.com", label: "Facebook" },
    { icon: Camera, href: "https://instagram.com", label: "Instagram" },
    { icon: MessageCircle, href: "https://twitter.com", label: "Twitter" },
    { icon: PlayCircle, href: "https://youtube.com", label: "YouTube" },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="relative overflow-hidden border-t border-ink-200 bg-ink-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-turf-300/20 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 border-b border-ink-200 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
                    {/* Brand */}
                    <div className="max-w-md">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-turf-400 to-turf-600 shadow-glow">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    className="h-6 w-6 text-white">
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

                        <p className="mt-4 text-sm leading-relaxed text-ink-600">
                            Indias leading football turf booking platform. Find, book, and play on premium pitches near you — with instant confirmation and zero booking fees.
                        </p>

                        <div className="mt-6 space-y-2 text-sm text-ink-600">
                            <a href="mailto:hello@turfzone.com" className="flex items-center gap-2 transition-colors hover:text-turf-700">
                                <Mail className="h-4 w-4 text-turf-500" />
                                hello@turfzone.com
                            </a>
                            <a href="tel:+919876543210" className="flex items-center gap-2 transition-colors hover:text-turf-700">
                                <Phone className="h-4 w-4 text-turf-500" />
                                +91 98765 43210
                            </a>
                            <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-turf-500" />
                                Mumbai, India
                            </span>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:pl-8">
                        <h3 className="text-lg font-bold text-ink-900">Get turf deals in your inbox</h3>
                        <p className="mt-2 text-sm text-ink-600">
                            Join 12,000+ players. New turf alerts, exclusive discounts, and tournament invites — no spam.
                        </p>

                        <form onSubmit={(e) => e.preventDefault()} className="mt-5 flex flex-col gap-2 sm:flex-row">
                            <input type="email" required placeholder="you@email.com"
                                className="w-full rounded-full border border-ink-200 bg-white px-5 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-turf-400 focus:outline-none focus:ring-1 focus:ring-turf-400" />
                            <button type="submit"
                                className="rounded-full bg-gradient-to-r from-turf-500 to-turf-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-95">
                                Subscribe
                            </button>
                        </form>

                        <div className="mt-6 flex items-center gap-3">
                            {socials.map((social) => (
                                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 transition-all hover:border-turf-400 hover:bg-turf-500 hover:text-white">
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Links */}
                <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4 lg:py-16">
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-turf-700">{category}</h4>
                            <ul className="mt-4 space-y-3">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href}
                                            className="group inline-flex items-center gap-1 text-sm text-ink-600 transition-colors hover:text-turf-700">
                                            {link.name}
                                            <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-ink-200 py-6 sm:flex-row">
                    <p className="text-xs text-ink-500">
                        © {year} TurfZone. All rights reserved. Made with ⚽ in India.
                    </p>
                    <div className="flex items-center gap-6 text-xs text-ink-500">
                        <Link href="/terms" className="transition-colors hover:text-turf-700">Terms</Link>
                        <Link href="/privacy" className="transition-colors hover:text-turf-700">Privacy</Link>
                        <Link href="/sitemap" className="transition-colors hover:text-turf-700">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}