// src/lib/bkash.js
import "server-only";

/* -------------------------------------------------------------- */
/* Config                                                          */
/* -------------------------------------------------------------- */

const BASE_URL = process.env.BKASH_BASE_URL;
const USERNAME = process.env.BKASH_USERNAME;
const PASSWORD = process.env.BKASH_PASSWORD;
const APP_KEY = process.env.BKASH_APP_KEY;
const APP_SECRET = process.env.BKASH_APP_SECRET;

/* -------------------------------------------------------------- */
/* Token cache (module-scope, per server instance)                 */
/* -------------------------------------------------------------- */

let cachedToken = null;
let cachedTokenExpiresAt = 0;

/**
 * Get (or refresh) the bKash id_token.
 * Tokens are valid ~1 hour; we cache for 55 minutes to be safe.
 */
export async function getBkashToken() {
    const now = Date.now();
    if (cachedToken && now < cachedTokenExpiresAt) return cachedToken;

    const res = await fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: USERNAME, // Must be lowercase 'username'
            password: PASSWORD, // Must be lowercase 'password'
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
        throw new Error(
            data?.statusMessage || "Failed to obtain bKash token."
        );
    }

    cachedToken = data.id_token;
    cachedTokenExpiresAt = now + 55 * 60 * 1000;
    return cachedToken;
}

/* -------------------------------------------------------------- */
/* Create payment                                                  */
/* -------------------------------------------------------------- */

/**
 * @param {object} params
 * @param {number} params.amount          e.g. 800
 * @param {string} params.payerReference  your booking id
 * @param {string} params.callbackURL     where bKash redirects after payment
 */
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

/* -------------------------------------------------------------- */
/* Execute payment                                                 */
/* -------------------------------------------------------------- */

/**
 * Finalize the payment after the user returns from bKash.
 */
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

/**
 * Query payment status (used if execute fails on a network blip).
 */
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