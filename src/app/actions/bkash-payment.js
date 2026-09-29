// src/app/actions/bkash-payment.js
"use server";

import { db } from "@/db";
import { bookings, pitches } from "@/db/schema";
import { timeBlocks } from "@/db/timeblock-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createBkashPayment, executeBkashPayment } from "@/lib/bkash";

/* -------------------------------------------------------------- */
/* Helpers                                                         */
/* -------------------------------------------------------------- */

/** UUID v4-ish check. Any real Postgres uuid will match. */
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(v) {
    return typeof v === "string" && UUID_RE.test(v);
}

/**
 * Resolve the app's public origin for building the bKash callback URL.
 *
 * Order of preference:
 *   1. BETTER_AUTH_URL  (explicit, set as a Worker secret)
 *   2. NEXT_PUBLIC_APP_URL  (fallback, set at build time)
 *
 * Throws if neither is set, or if the resolved origin is http:// in a
 * non-local environment — bKash rejects non-HTTPS callback URLs.
 */
function getAppOrigin() {
    const raw =
        process.env.BETTER_AUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "";

    const trimmed = String(raw).trim().replace(/\/+$/, "");

    if (!trimmed) {
        throw new Error(
            "Server misconfigured: set BETTER_AUTH_URL (or NEXT_PUBLIC_APP_URL) to your public https URL."
        );
    }

    const isLocal =
        trimmed.startsWith("http://localhost") ||
        trimmed.startsWith("http://127.0.0.1");

    if (!isLocal && !trimmed.startsWith("https://")) {
        throw new Error(
            `BETTER_AUTH_URL must be an https:// URL in production (got "${trimmed}"). bKash requires HTTPS callbacks.`
        );
    }

    return trimmed;
}

/**
 * Resolve the block a user is trying to book.
 *
 * Two shapes of `timeBlockId` are possible:
 *   1. Real uuid → row in time_blocks (a per-date override).
 *   2. "default-<pitchId>-<index>" → entry in pitches.defaultBlocks.
 *
 * Returns { startTime, endTime, price, dbId } where dbId is the
 * time_blocks.id (or null when the block came from the default template).
 */
async function resolveBookingBlock({ pitch, pitchId, timeBlockId }) {
    // Case 2: default template
    if (typeof timeBlockId === "string" && timeBlockId.startsWith("default-")) {
        const parts = timeBlockId.split("-");
        const index = Number(parts[parts.length - 1]);
        const list = Array.isArray(pitch.defaultBlocks) ? pitch.defaultBlocks : [];

        if (!Number.isInteger(index) || index < 0 || index >= list.length) {
            throw new Error("Time block not found.");
        }

        const b = list[index];
        if (!b) throw new Error("Time block not found.");
        if (Number(b.price) <= 0) throw new Error("Invalid block price.");

        return {
            startTime: String(b.startTime),
            endTime: String(b.endTime),
            price: Number(b.price),
            dbId: null,
        };
    }

    // Case 1: per-date override (real uuid)
    if (!isUuid(timeBlockId)) {
        throw new Error("Invalid time block reference.");
    }

    const [block] = await db
        .select()
        .from(timeBlocks)
        .where(
            and(
                eq(timeBlocks.id, timeBlockId),
                eq(timeBlocks.pitchId, pitchId),
                eq(timeBlocks.isActive, true)
            )
        )
        .limit(1);

    if (!block) throw new Error("Time block not found.");
    if (Number(block.price) <= 0) throw new Error("Invalid block price.");

    return {
        startTime: block.startTime,
        endTime: block.endTime,
        price: Number(block.price),
        dbId: block.id,
    };
}

/* -------------------------------------------------------------- */
/* Start payment                                                   */
/* -------------------------------------------------------------- */

export async function startBkashBooking({ pitchId, timeBlockId, bookingDate }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    if (!pitchId || !timeBlockId || !bookingDate) {
        throw new Error("Missing booking details.");
    }

    // Fail fast if required secrets are missing on the Worker.
    if (!process.env.BKASH_BASE_URL || !process.env.BKASH_APP_KEY) {
        console.error(
            "[startBkashBooking] Missing bKash env vars. Ensure BKASH_BASE_URL, BKASH_USERNAME, BKASH_PASSWORD, BKASH_APP_KEY, BKASH_APP_SECRET are set as Worker secrets."
        );
        throw new Error("Payment service is not configured.");
    }

    const [pitch] = await db
        .select()
        .from(pitches)
        .where(and(eq(pitches.id, pitchId), eq(pitches.isActive, true)))
        .limit(1);

    if (!pitch) throw new Error("Ground not found or inactive.");

    const { startTime, endTime, price, dbId } = await resolveBookingBlock({
        pitch,
        pitchId,
        timeBlockId,
    });

    // Past-slot check
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (bookingDate < todayKey) throw new Error("Cannot book a slot in the past.");

    if (bookingDate === todayKey) {
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const startMins =
            Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
        const isPostMidnight = startMins < 6 * 60;
        if (!isPostMidnight && startMins <= nowMins) {
            throw new Error("This slot has already passed.");
        }
    }

    // Conflict check
    const existing = await db
        .select()
        .from(bookings)
        .where(
            and(
                eq(bookings.pitchId, pitchId),
                eq(bookings.bookingDate, bookingDate)
            )
        );
    const hasOverlap = existing.some(
        (b) =>
            b.status !== "cancelled" &&
            startTime < b.endTime &&
            endTime > b.startTime
    );
    if (hasOverlap) throw new Error("This slot is already booked.");

    // Create pending booking
    let booking;
    try {
        const [row] = await db
            .insert(bookings)
            .values({
                userId: session.user.id,
                pitchId,
                timeBlockId: dbId, // null when booking from default template
                bookingDate,
                startTime,
                endTime,
                totalPrice: String(price),
                status: "pending",
                paymentMethod: "bkash",
                paymentStatus: "pending",
            })
            .returning();
        booking = row;
    } catch (err) {
        const code = err?.code ?? err?.cause?.code;
        if (code === "23505") {
            throw new Error(
                "This slot was just booked by someone else. Please choose another."
            );
        }
        console.error("[startBkashBooking] insert failed:", err);
        throw err;
    }

    // Build bKash callback URL from the app's public origin.
    let origin;
    try {
        origin = getAppOrigin();
    } catch (err) {
        // Booking row already created; cancel it before re-throwing.
        await db
            .update(bookings)
            .set({ status: "cancelled" })
            .where(eq(bookings.id, booking.id));
        throw err;
    }

    const callbackURL = `${origin}/api/bkash/callback?bookingId=${booking.id}`;

    let payment;
    try {
        payment = await createBkashPayment({
            amount: price,
            payerReference: booking.id,
            callbackURL,
        });
    } catch (err) {
        // Log the raw bKash error so it shows up in `wrangler tail`.
        console.error("[startBkashBooking] createBkashPayment failed:", {
            message: err?.message,
            stack: err?.stack,
            callbackURL,
            amount: price,
        });

        // Free up the slot.
        await db
            .update(bookings)
            .set({ status: "cancelled" })
            .where(eq(bookings.id, booking.id));

        throw new Error(
            err?.message || "Could not start bKash payment. Please try again."
        );
    }

    await db
        .update(bookings)
        .set({ bkashPaymentID: payment.paymentID })
        .where(eq(bookings.id, booking.id));

    return {
        bookingId: booking.id,
        paymentID: payment.paymentID,
        bkashURL: payment.bkashURL,
        amount: price,
    };
}

/* -------------------------------------------------------------- */
/* Finalize payment                                                */
/* -------------------------------------------------------------- */

export async function finalizeBkashPayment({ bookingId, paymentID }) {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) throw new Error("Booking not found.");
    if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
        return { ok: true, alreadyFinalized: true, trxID: booking.bkashTrxID };
    }

    const result = await executeBkashPayment(paymentID);

    const trxStatus = result?.transactionStatus;
    const isSuccess =
        result?.statusCode === "0000" &&
        (trxStatus === "Completed" || trxStatus === "Success");

    if (!isSuccess) {
        await db
            .update(bookings)
            .set({ status: "cancelled" })
            .where(eq(bookings.id, bookingId));

        revalidatePath("/book");
        return {
            ok: false,
            message: result?.statusMessage || "Payment was not completed.",
            raw: result,
        };
    }

    await db
        .update(bookings)
        .set({
            status: "confirmed",
            paymentStatus: "paid",
            bkashTrxID: result.trxID || null,
        })
        .where(eq(bookings.id, bookingId));

    revalidatePath("/book");
    revalidatePath("/bookings");
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");

    return { ok: true, trxID: result.trxID };
}