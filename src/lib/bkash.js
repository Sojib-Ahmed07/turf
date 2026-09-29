// src/lib/bkash.js
import "server-only";

const BASE_URL = process.env.BKASH_BASE_URL;
const USERNAME = process.env.BKASH_USERNAME;
const PASSWORD = process.env.BKASH_PASSWORD;
const APP_KEY = process.env.BKASH_APP_KEY;
const APP_SECRET = process.env.BKASH_APP_SECRET;

let cachedToken = null;
let cachedTokenExpiresAt = 0;

/**
 * Get (or refresh) the bKash id_token.
 * 
 * CRITICAL: bKash's sandbox requires the `username` and `password` as HTTP headers.
 * Cloudflare Workers' fetch() can be strict about header values. We need to ensure
 * they are sent as raw strings without any encoding.
 */
export async function getBkashToken() {
    const now = Date.now();
    if (cachedToken && now < cachedTokenExpiresAt) return cachedToken;

    const res = await fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: USERNAME,
            password: PASSWORD,
        },
        body: JSON.stringify({
            app_key: APP_KEY,
            app_secret: APP_SECRET,
        }),
        cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok || !data?.id_token) {
        console.error("bKash token error:", data);
        // Log headers for debugging (sanitized)
        console.error("Request headers sent:", {
            username: USERNAME,
            passwordLength: PASSWORD ? PASSWORD.length : 0,
        });
        throw new Error(
            data?.statusMessage || "Failed to obtain bKash token."
        );
    }

    cachedToken = data.id_token;
    cachedTokenExpiresAt = now + 55 * 60 * 1000;
    return cachedToken;
}

export async function createBkashPayment({ amount, payerReference, callbackURL }) {
    const token = await getBkashToken();

    const res = await fetch(`${BASE_URL}/tokenized/checkout/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token,
            "X-APP-Key": APP_KEY,
        },
        body: JSON.stringify({
            mode: "0011",
            payerReference,
            callbackURL,
            amount: String(amount),
            currency: "BDT",
            intent: "sale",
            merchantInvoiceNumber: `INV-${payerReference}`,
        }),
        cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok || !data?.bkashURL) {
        console.error("bKash create error:", data);
        throw new Error(
            data?.statusMessage || "Failed to create bKash payment."
        );
    }

    return {
        paymentID: data.paymentID,
        bkashURL: data.bkashURL,
        amount: data.amount,
    };
}

export async function executeBkashPayment(paymentID) {
    const token = await getBkashToken();

    const res = await fetch(`${BASE_URL}/tokenized/checkout/execute`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token,
            "X-APP-Key": APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
        cache: "no-store",
    });

    const data = await res.json();
    return data;
}

export async function queryBkashPayment(paymentID) {
    const token = await getBkashToken();

    const res = await fetch(`${BASE_URL}/tokenized/checkout/payment/status`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token,
            "X-APP-Key": APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
        cache: "no-store",
    });

    const data = await res.json();
    return data;
}