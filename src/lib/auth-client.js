// src/lib/auth-client.js
"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
export const loginWithEmail = async (email, password) => {
    return authClient.signIn.email({ email, password });
};

/** Email + password signup */
export const registerWithEmail = async ({ name, email, password }) => {
    return authClient.signUp.email({ name, email, password });
};

/** Sign out + redirect */
export const logout = async (redirectTo = "/") => {
    await authClient.signOut();
    window.location.href = redirectTo;
};