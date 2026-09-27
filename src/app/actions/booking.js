// src/app/actions/booking.js
"use server";

import { db } from "@/db";
import { bookings, pitches } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, ne } from "drizzle-orm";

/**
 * Fetch all active pitches.
 */
export async function getPitches() {
    try {
        const rows = await db
            .select()
            .from(pitches)
            .where(eq(pitches.isActive, true));

        return rows.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            hourlyRate: String(p.hourlyRate),
            imageUrl: p.imageUrl ?? null,
            isActive: p.isActive,
        }));
    } catch (err) {
        console.error("getPitches error:", err);
        throw new Error("Failed to load pitches.");
    }
}

/**
 * Fetch booked start times for a given pitch & date.
 * Considers both 'confirmed' and 'pending' bookings as blocking.
 */
export async function getBookedSlots(pitchId, date) {
    if (!pitchId || !date) return [];

    try {
        const rows = await db
            .select({ startTime: bookings.startTime })
            .from(bookings)
            .where(
                and(
                    eq(bookings.pitchId, pitchId),
                    eq(bookings.bookingDate, date),
                    ne(bookings.status, "cancelled")
                )
            );

        return rows.map((r) => r.startTime);
    } catch (err) {
        console.error("getBookedSlots error:", err);
        throw new Error("Failed to load booked slots.");
    }
}

/**
 * Fetch all bookings for the currently signed-in user.
 */
export async function getMyBookings() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return [];
    }

    try {
        const rows = await db
            .select({
                id: bookings.id,
                pitchId: bookings.pitchId,
                bookingDate: bookings.bookingDate,
                startTime: bookings.startTime,
                endTime: bookings.endTime,
                totalPrice: bookings.totalPrice,
                status: bookings.status,
                createdAt: bookings.createdAt,
                pitchName: pitches.name,
                pitchImage: pitches.imageUrl,
            })
            .from(bookings)
            .innerJoin(pitches, eq(bookings.pitchId, pitches.id))
            .where(eq(bookings.userId, session.user.id))
            .orderBy(bookings.bookingDate, bookings.startTime);

        return rows.map((r) => ({
            id: r.id,
            pitchId: r.pitchId,
            pitchName: r.pitchName,
            pitchImage: r.pitchImage ?? null,
            bookingDate: r.bookingDate,
            startTime: r.startTime,
            endTime: r.endTime,
            totalPrice: String(r.totalPrice),
            status: r.status,
            createdAt: r.createdAt,
        }));
    } catch (err) {
        console.error("getMyBookings error:", err);
        throw new Error("Failed to load your bookings.");
    }
}

/**
 * Create a booking for the currently signed-in user.
 *
 * Race-safety strategy (two layers):
 *   1. JS overlap check — catches multi-slot overlaps (e.g. 06:00-08:00 vs 07:00-08:00).
 *   2. DB partial unique index — catches identical-start-time races across concurrent users.
 */
export async function createBooking({
    pitchId,
    bookingDate,
    startTime,
    endTime,
    totalPrice,
    paymentMethod = "cash", // "cash" | "bkash"
}) {
    // --- 1. Auth check ---
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized: Please sign in to book.");
    }

    // --- 2. Input validation ---
    if (!pitchId || !bookingDate || !startTime || !endTime) {
        throw new Error("Missing required booking fields.");
    }
    if (startTime >= endTime) {
        throw new Error("End time must be after start time.");
    }

    // --- 3. Reject past slots ---
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (bookingDate < todayKey) {
        throw new Error("Cannot book a slot in the past.");
    }
    if (bookingDate === todayKey) {
        const nowKey = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
        if (startTime <= nowKey) {
            throw new Error("This slot has already passed.");
        }
    }

    // --- 4. Verify pitch exists & is active ---
    const pitchRows = await db
        .select()
        .from(pitches)
        .where(and(eq(pitches.id, pitchId), eq(pitches.isActive, true)))
        .limit(1);

    if (pitchRows.length === 0) {
        throw new Error("Pitch not found or inactive.");
    }

    // --- 5. JS overlap check (catches multi-slot overlaps) ---
    const existing = await db
        .select()
        .from(bookings)
        .where(
            and(
                eq(bookings.pitchId, pitchId),
                eq(bookings.bookingDate, bookingDate),
                ne(bookings.status, "cancelled")
            )
        );

    const hasOverlap = existing.some(
        (b) => startTime < b.endTime && endTime > b.startTime
    );

    if (hasOverlap) {
        throw new Error("This slot is already booked. Please choose another.");
    }

    // --- 6. Insert (race-safe; DB unique index is the final guard) ---
    let inserted;
    try {
        const isBkash = paymentMethod === "bkash";

        inserted = await db
            .insert(bookings)
            .values({
                userId: session.user.id,
                pitchId,
                bookingDate,
                startTime,
                endTime,
                totalPrice: String(totalPrice),
                status: "confirmed",
                paymentMethod: isBkash ? "bkash" : "cash",
                paymentStatus: isBkash ? "pending" : "unpaid",
            })
            .returning();
    } catch (err) {
        const code = err?.code ?? err?.cause?.code;
        if (code === "23505") {
            throw new Error(
                "This slot was just booked by someone else. Please choose another."
            );
        }
        console.error("createBooking insert error:", err);
        throw new Error("Failed to create booking. Please try again.");
    }

    return {
        id: inserted[0].id,
        pitchId: inserted[0].pitchId,
        bookingDate: inserted[0].bookingDate,
        startTime: inserted[0].startTime,
        endTime: inserted[0].endTime,
        totalPrice: String(inserted[0].totalPrice),
        status: inserted[0].status,
    };
}

/**
 * Cancel a booking. Only the owner (or an admin) can cancel.
 */
export async function cancelBooking(bookingId) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized: Please sign in.");
    }

    const rows = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (rows.length === 0) {
        throw new Error("Booking not found.");
    }

    const booking = rows[0];
    const isOwner = booking.userId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
        throw new Error("You are not allowed to cancel this booking.");
    }

    await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, bookingId));

    return { id: bookingId, status: "cancelled" };
}