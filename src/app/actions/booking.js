// src/app/actions/booking.js
"use server";

import { db } from "@/db";
import { bookings, pitches } from "@/db/schema";
import { timeBlocks } from "@/db/timeblock-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, ne, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/* -------------------------------------------------------------- */
/* Pitches                                                         */
/* -------------------------------------------------------------- */

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
            sport: p.sport,
            hourlyRate: String(p.hourlyRate),
            openHour: p.openHour,
            closeHour: p.closeHour,
            defaultSlotMinutes: p.defaultSlotMinutes,
            imageUrl: p.imageUrl ?? null,
            isActive: p.isActive,
        }));
    } catch (err) {
        console.error("getPitches error:", err);
        throw new Error("Failed to load pitches.");
    }
}

/* -------------------------------------------------------------- */
/* Time blocks for a specific date (override or default)           */
/* -------------------------------------------------------------- */

/**
 * Returns the block list for a pitch on a specific date.
 * If a per-date override exists in time_blocks, it wins.
 * Otherwise the pitch's defaultBlocks template is returned.
 */
export async function getTimeBlocksForPitch(pitchId, date) {
    if (!pitchId || !date) return [];

    const overrides = await db
        .select()
        .from(timeBlocks)
        .where(
            and(
                eq(timeBlocks.pitchId, pitchId),
                eq(timeBlocks.date, date),
                eq(timeBlocks.isActive, true)
            )
        )
        .orderBy(asc(timeBlocks.sortOrder));

    if (overrides.length > 0) {
        return overrides.map((b) => ({
            id: b.id,
            startTime: b.startTime,
            endTime: b.endTime,
            price: String(b.price),
            sortOrder: b.sortOrder,
        }));
    }

    const [pitch] = await db
        .select({ defaultBlocks: pitches.defaultBlocks })
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);

    if (!pitch || !Array.isArray(pitch.defaultBlocks)) return [];

    return pitch.defaultBlocks
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((b, i) => ({
            id: `default-${pitchId}-${i}`,
            startTime: b.startTime,
            endTime: b.endTime,
            price: String(b.price),
            sortOrder: i,
        }));
}

/* -------------------------------------------------------------- */
/* Availability                                                    */
/* -------------------------------------------------------------- */

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

/* -------------------------------------------------------------- */
/* My bookings                                                     */
/* -------------------------------------------------------------- */

export async function getMyBookings() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];

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
                paymentMethod: bookings.paymentMethod,
                paymentStatus: bookings.paymentStatus,
                bkashTrxID: bookings.bkashTrxID,
                bkashPaymentID: bookings.bkashPaymentID,
                createdAt: bookings.createdAt,
                pitchName: pitches.name,
                pitchSport: pitches.sport,
                pitchImage: pitches.imageUrl,
                pitchDescription: pitches.description,
            })
            .from(bookings)
            .innerJoin(pitches, eq(bookings.pitchId, pitches.id))
            .where(eq(bookings.userId, session.user.id))
            .orderBy(desc(bookings.createdAt));

        return rows.map((r) => ({
            id: r.id,
            pitchId: r.pitchId,
            pitchName: r.pitchName,
            pitchSport: r.pitchSport,
            pitchImage: r.pitchImage ?? null,
            pitchDescription: r.pitchDescription ?? "",
            bookingDate: r.bookingDate,
            startTime: r.startTime,
            endTime: r.endTime,
            totalPrice: String(r.totalPrice),
            status: r.status,
            paymentMethod: r.paymentMethod,
            paymentStatus: r.paymentStatus,
            bkashTrxID: r.bkashTrxID,
            bkashPaymentID: r.bkashPaymentID,
            createdAt: r.createdAt?.toISOString?.() ?? null,
        }));
    } catch (err) {
        console.error("getMyBookings error:", err);
        throw new Error("Failed to load your bookings.");
    }
}

/* -------------------------------------------------------------- */
/* Cancel booking (owner only)                                     */
/* -------------------------------------------------------------- */

export async function cancelBooking(bookingId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) throw new Error("Booking not found.");
    if (booking.userId !== session.user.id) {
        throw new Error("You can only cancel your own bookings.");
    }

    await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, bookingId));

    revalidatePath("/bookings");
    revalidatePath("/book");
    revalidatePath("/profile");
    return { ok: true };
}