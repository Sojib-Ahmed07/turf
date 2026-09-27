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

        // Serialize decimals to strings for client components
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
 * Create a booking for the currently signed-in user.
 * Prevents double-booking via a re-check + insert inside a transaction-like flow.
 */
export async function createBooking({
    pitchId,
    bookingDate,
    startTime,
    endTime,
    totalPrice,
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

    // --- 3. Verify pitch exists & is active ---
    const pitchRows = await db
        .select()
        .from(pitches)
        .where(and(eq(pitches.id, pitchId), eq(pitches.isActive, true)))
        .limit(1);

    if (pitchRows.length === 0) {
        throw new Error("Pitch not found or inactive.");
    }

    // --- 4. Conflict check (with all overlapping intervals) ---
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

    // --- 5. Insert ---
    const inserted = await db
        .insert(bookings)
        .values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            pitchId,
            bookingDate,
            startTime,
            endTime,
            totalPrice: String(totalPrice),
            status: "confirmed",
        })
        .returning();

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