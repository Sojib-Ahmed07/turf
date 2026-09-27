// src/components/auth/AuthLayout.jsx
import Link from "next/link";

export default function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="relative isolate flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-ink-50 px-4 py-12">
            {/* Ambient background glows */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-turf-300/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-turf-200/40 blur-3xl" />

            {/* Grid pattern */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <Link
                    href="/"
                    className="mx-auto mb-8 flex w-fit items-center gap-2 transition-opacity hover:opacity-80"
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-turf-400 to-turf-600 shadow-glow">
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
                    <span className="text-xl font-extrabold tracking-tight text-ink-900">
                        Turf<span className="text-turf-600">Zone</span>
                    </span>
                </Link>

                {/* Card */}
                <div className="rounded-3xl border border-ink-200 bg-white p-8 shadow-xl shadow-ink-900/5 sm:p-10">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-2 text-sm text-ink-600">{subtitle}</p>
                        )}
                    </div>
                    {children}
                </div>

                {footer && (
                    <p className="mt-6 text-center text-sm text-ink-600">{footer}</p>
                )}
            </div>
        </div>
    );
}