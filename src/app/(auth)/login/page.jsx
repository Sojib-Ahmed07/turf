// src/app/login/page.jsx
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import TextField from "@/components/auth/TextField";
import { loginWithEmail, signInWithGoogle } from "@/lib/auth-client";

/** Only allow same-site relative paths as redirect targets. */
function safeCallback(raw) {
    if (!raw || typeof raw !== "string") return "/";
    // must start with a single "/" and not "//" (protocol-relative) or "/\"
    if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
        return "/";
    }
    return raw;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = safeCallback(searchParams.get("callbackUrl"));

    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setErrors((er) => ({ ...er, [e.target.name]: "" }));
        setServerError("");
    };

    /* ---------- Email / Password login ---------- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");

        const next = {};
        if (!form.email.trim()) next.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email))
            next.email = "Enter a valid email";
        if (!form.password) next.password = "Password is required";

        if (Object.keys(next).length) {
            setErrors(next);
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await loginWithEmail(
                form.email,
                form.password,
                callbackUrl
            );

            if (error) {
                setServerError(error.message || "Invalid email or password");
                setSubmitting(false);
                return;
            }

            // Success — go where the user was headed (default home)
            router.push(callbackUrl);
            router.refresh();
        } catch (err) {
            console.error("Login error:", err);
            setServerError("Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    /* ---------- Google OAuth ---------- */
    const handleGoogle = async () => {
        setServerError("");
        setGoogleLoading(true);
        try {
            await signInWithGoogle(callbackUrl);
            // Better Auth handles the redirect automatically
        } catch (err) {
            console.error("Google login error:", err);
            setServerError("Google sign-in failed. Please try again.");
            setGoogleLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Log in to book your next match"
            footer={
                <>
                    Don&apos;t have an account?{" "}
                    <Link
                        href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                        className="font-semibold text-turf-700 hover:text-turf-600 hover:underline"
                    >
                        Sign up
                    </Link>
                </>
            }
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
            >
                {serverError && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{serverError}</span>
                    </div>
                )}

                <GoogleButton
                    onClick={handleGoogle}
                    loading={googleLoading}
                    label="Continue with Google"
                />

                <div className="relative flex items-center">
                    <div className="flex-1 border-t border-ink-200" />
                    <span className="px-3 text-xs font-medium uppercase tracking-wider text-ink-400">
                        or
                    </span>
                    <div className="flex-1 border-t border-ink-200" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <TextField
                        label="Email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@email.com"
                        autoComplete="email"
                        error={errors.email}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        error={errors.password}
                    />

                    <div className="flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-ink-300 text-turf-600 focus:ring-turf-500"
                            />
                            Remember me
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-sm font-semibold text-turf-700 hover:text-turf-600 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || googleLoading}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-turf-500 to-turf-600 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {submitting ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign in
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}