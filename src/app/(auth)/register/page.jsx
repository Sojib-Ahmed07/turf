// src/app/register/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import TextField from "@/components/auth/TextField";
import { registerWithEmail, signInWithGoogle } from "@/lib/auth-client";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirm: "",
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setErrors((er) => ({ ...er, [e.target.name]: "" }));
        setServerError("");
    };

    /* ---------- Email / Password signup ---------- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");

        // Validation
        const next = {};
        if (!form.name.trim()) next.name = "Name is required";
        if (!form.email.trim()) next.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email))
            next.email = "Enter a valid email";
        if (form.password.length < 6)
            next.password = "Password must be at least 6 characters";
        if (form.password !== form.confirm)
            next.confirm = "Passwords don't match";

        if (Object.keys(next).length) {
            setErrors(next);
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await registerWithEmail({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
            });

            if (error) {
                setServerError(error.message || "Could not create account");
                setSubmitting(false);
                return;
            }

            // Success — redirect
            router.push("/");
            router.refresh();
        } catch (err) {
            console.error("Register error:", err);
            setServerError("Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    /* ---------- Google OAuth ---------- */
    const handleGoogle = async () => {
        setServerError("");
        setGoogleLoading(true);
        try {
            await signInWithGoogle("/");
        } catch (err) {
            console.error("Google signup error:", err);
            setServerError("Google sign-up failed. Please try again.");
            setGoogleLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Join thousands of players booking turfs daily"
            footer={
                <>
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-turf-700 hover:text-turf-600 hover:underline"
                    >
                        Log in
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
                {/* Server error banner */}
                {serverError && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{serverError}</span>
                    </div>
                )}

                {/* Google */}
                <GoogleButton
                    onClick={handleGoogle}
                    loading={googleLoading}
                    label="Sign up with Google"
                />

                {/* Divider */}
                <div className="relative flex items-center">
                    <div className="flex-1 border-t border-ink-200" />
                    <span className="px-3 text-xs font-medium uppercase tracking-wider text-ink-400">
                        or
                    </span>
                    <div className="flex-1 border-t border-ink-200" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <TextField
                        label="Full name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Rahul Sharma"
                        autoComplete="name"
                        error={errors.name}
                    />
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
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        error={errors.password}
                    />
                    <TextField
                        label="Confirm password"
                        type="password"
                        name="confirm"
                        value={form.confirm}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        error={errors.confirm}
                    />

                    {/* Password rules */}
                    <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                            Password must contain
                        </p>
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                            <Rule ok={form.password.length >= 6}>6+ characters</Rule>
                            <Rule ok={/[A-Z]/.test(form.password)}>One uppercase</Rule>
                            <Rule ok={/[0-9]/.test(form.password)}>One number</Rule>
                            <Rule ok={/[^A-Za-z0-9]/.test(form.password)}>One symbol</Rule>
                        </ul>
                    </div>

                    {/* Terms */}
                    <label className="flex cursor-pointer items-start gap-2 text-xs text-ink-600">
                        <input
                            type="checkbox"
                            required
                            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-turf-600 focus:ring-turf-500"
                        />
                        <span>
                            I agree to the{" "}
                            <Link
                                href="/terms"
                                className="font-semibold text-turf-700 hover:underline"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="font-semibold text-turf-700 hover:underline"
                            >
                                Privacy Policy
                            </Link>
                        </span>
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting || googleLoading}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-turf-500 to-turf-600 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {submitting ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Creating account...
                            </>
                        ) : (
                            <>
                                Create account
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </AuthLayout>
    );
}

/* Small helper for the password rules list */
function Rule({ ok, children }) {
    return (
        <li
            className={`flex items-center gap-1.5 transition-colors ${ok ? "text-turf-700" : "text-ink-400"
                }`}
        >
            <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors ${ok ? "bg-turf-500 text-white" : "bg-ink-200 text-ink-400"
                    }`}
            >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            {children}
        </li>
    );
}