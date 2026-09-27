// src/app/actions/bkash-payment.js
"use server";

import { db } from "@/db";
import { bookings, pitches } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createBkashPayment, executeBkashPayment } from "@/lib/bkash";

/** Flat booking fee in BDT */
const BOOKING_FEE = 1000;

/**
 * Create a pending booking and start a bKash payment session.
 */
export async function startBkashBooking({
    pitchId,
    bookingDate,
    startTime,
    endTime,
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    // Validate pitch
    const [pitch] = await db
        .select()
        .from(pitches)
        .where(and(eq(pitches.id, pitchId), eq(pitches.isActive, true)))
        .limit(1);

    if (!pitch) throw new Error("Pitch not found or inactive.");

    // Reject past slots
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (bookingDate < todayKey) throw new Error("Cannot book a slot in the past.");
    if (bookingDate === todayKey) {
        const nowKey = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
        if (startTime <= nowKey) throw new Error("This slot has already passed.");
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
                bookingDate,
                startTime,
                endTime,
                totalPrice: String(BOOKING_FEE),
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
        throw err;
    }

    // Start bKash
    const origin = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const callbackURL = `${origin}/api/bkash/callback?bookingId=${booking.id}`;

    let payment;
    try {
        payment = await createBkashPayment({
            amount: BOOKING_FEE,
            payerReference: booking.id,
            callbackURL,
        });
    } catch (err) {
        // Free up slot
        await db
            .update(bookings)
            .set({ status: "cancelled" })
            .where(eq(bookings.id, booking.id));
        throw err;
    }

    await db
        .update(bookings)
        .set({ bkashPaymentID: payment.paymentID })
        .where(eq(bookings.id, booking.id));

    return {
        bookingId: booking.id,
        paymentID: payment.paymentID,
        bkashURL: payment.bkashURL,
    };
}

/**
 * Execute the payment and confirm the booking if successful.
 * Called from the bKash callback route (NOT from a page render).
 */
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