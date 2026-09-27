// src/app/actions/bkash-payment.js
"use server";

import { db } from "@/db";
import { bookings, pitches } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createBkashPayment, executeBkashPayment } from "@/lib/bkash";

/**
 * Called from the booking modal when the user picks bKash.
 * Creates the booking (pending) + starts a bKash payment session.
 * Returns { bkashURL } for the browser to redirect to.
 */
export async function startBkashBooking({
    pitchId,
    bookingDate,
    startTime,
    endTime,
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    // Validate slot & compute price server-side (don't trust the client)
    const [pitch] = await db
        .select()
        .from(pitches)
        .where(and(eq(pitches.id, pitchId), eq(pitches.isActive, true)))
        .limit(1);

    if (!pitch) throw new Error("Pitch not found or inactive.");

    const amount = Number(pitch.hourlyRate);

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

    // Insert pending booking
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
                totalPrice: String(amount),
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

    // Start bKash payment
    const origin =
        process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const callbackURL = `${origin}/api/bkash/callback?bookingId=${booking.id}`;

    let payment;
    try {
        payment = await createBkashPayment({
            amount,
            payerReference: booking.id,
            callbackURL,
        });
    } catch (err) {
        // Roll back the booking so the slot frees up
        await db
            .update(bookings)
            .set({ status: "cancelled" })
            .where(eq(bookings.id, booking.id));
        throw err;
    }

    // Persist paymentID
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
 * Called by the /payment/success page after bKash redirects back.
 * Executes the payment and confirms the booking if successful.
 */
export async function finalizeBkashPayment({ bookingId, paymentID }) {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) throw new Error("Booking not found.");
    if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
        return { ok: true, alreadyFinalized: true };
    }

    const result = await executeBkashPayment(paymentID);

    const trxStatus = result?.transactionStatus;
    const isSuccess =
        result?.statusCode === "0000" &&
        (trxStatus === "Completed" || trxStatus === "Success");

    if (!isSuccess) {
        // Payment failed — free the slot
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