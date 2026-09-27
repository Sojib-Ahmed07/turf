// src/components/auth/TextField.jsx
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function TextField({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    required = true,
    autoComplete,
    error,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div>
            <label
                htmlFor={name}
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    autoComplete={autoComplete}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2 ${error
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-ink-200 focus:border-turf-400 focus:ring-turf-100"
                        } ${isPassword ? "pr-11" : ""}`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
            )}
        </div>
    );
}