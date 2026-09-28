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
import { minutesBetween } from "@/lib/slots";

/**
 * Create a pending booking and start a bKash payment session.
 * Price is authoritative server-side — read from the time block.
 */
export async function startBkashBooking({ pitchId, timeBlockId, bookingDate }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    if (!pitchId || !timeBlockId || !bookingDate) {
        throw new Error("Missing booking details.");
    }

    // Validate pitch
    const [pitch] = await db
        .select()
        .from(pitches)
        .where(and(eq(pitches.id, pitchId), eq(pitches.isActive, true)))
        .limit(1);

    if (!pitch) throw new Error("Ground not found or inactive.");

    // Load and validate block
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
    if (block.isGap) throw new Error("This time is not bookable.");
    if (Number(block.price) <= 0) throw new Error("Invalid block price.");

    const { startTime, endTime } = block;
    const price = Number(block.price);

    // Reject past slots (respects midnight-crossing convention)
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (bookingDate < todayKey) throw new Error("Cannot book a slot in the past.");

    if (bookingDate === todayKey) {
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const startMins = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
        // startMins < openHour*60 means it's a post-midnight slot belonging to
        // today's business day — always in the future relative to "now" during
        // the same business day. Only reject if startMins <= nowMins AND the
        // slot is in the morning block (>= open hour).
        const isPostMidnight = startMins < 6 * 60;
        if (!isPostMidnight && startMins <= nowMins) {
            throw new Error("This slot has already passed.");
        }
    }

    // Conflict check (application level — the partial unique index is the last line)
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
                timeBlockId: block.id,
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
        throw err;
    }

    const origin = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const callbackURL = `${origin}/api/bkash/callback?bookingId=${booking.id}`;

    let payment;
    try {
        payment = await createBkashPayment({
            amount: price,
            payerReference: booking.id,
            callbackURL,
        });
    } catch (err) {
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
        amount: price,
    };
}

/**
 * Execute the payment and confirm the booking if successful.
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