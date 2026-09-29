// src/lib/auth-client.js
"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Resolve the auth base URL at runtime.
 *
 * In the browser, always use the current origin so the client talks to
 * whatever host loaded the page. This makes the same bundle work on
 * localhost, workers.dev, and any custom domain without a rebuild.
 *
 * On the server (SSR / RSC), fall back to NEXT_PUBLIC_APP_URL.
 */
const baseURL =
    typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({
    baseURL,
});

export const { signIn, signUp, signOut, useSession } = authClient;

/* ---------- Convenience helpers ---------- */

/** Trigger Google OAuth flow */
export const signInWithGoogle = async (callbackURL = "/") => {
    return authClient.signIn.social({
        provider: "google",
        callbackURL,
    });
};

/** Email + password login */
export const loginWithEmail = async (email, password, callbackURL) => {
    return authClient.signIn.email({
        email,
        password,
        ...(callbackURL ? { callbackURL } : {}),
    });
};

/** Email + password signup */
export const registerWithEmail = async ({ name, email, password, callbackURL }) => {
    return authClient.signUp.email({
        name,
        email,
        password,
        ...(callbackURL ? { callbackURL } : {}),
    });
};

/** Sign out + redirect */
export const logout = async (redirectTo = "/") => {
    await authClient.signOut();
    window.location.href = redirectTo;
};