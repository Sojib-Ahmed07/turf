// src/app/actions/admin.js
"use server";

import { db } from "@/db";
import { bookings, pitches } from "@/db/schema";
import { timeBlocks } from "@/db/timeblock-schema";
import { user } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq, desc, gte, lte, sql, ne, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    generateDefaultBlocks,
    validateBlocks,
    deriveHours,
} from "@/lib/slots";
import { SPORTS } from "@/db/pitch-schema";

/* -------------------------------------------------------------- */
/* Guard                                                           */
/* -------------------------------------------------------------- */

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "admin") throw new Error("Forbidden");
    return session.user;
}

/* -------------------------------------------------------------- */
/* Helpers                                                         */
/* -------------------------------------------------------------- */

function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function dateKeyPlus(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function revalidateAdminAll() {
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/pitches");
    revalidatePath("/book");
}

/* -------------------------------------------------------------- */
/* Dashboard stats                                                 */
/* -------------------------------------------------------------- */

export async function getDashboardStats() {
    await requireAdmin();

    const today = todayKey();
    const weekStart = dateKeyPlus(-6);
    const monthStart = today.slice(0, 8) + "01";

    const [todayRows, weekRows, monthRows, activePitches] = await Promise.all([
        db
            .select({
                count: sql`count(*)`.as("count"),
                revenue: sql`coalesce(sum(${bookings.totalPrice}), 0)`.as("revenue"),
            })
            .from(bookings)
            .where(
                and(
                    eq(bookings.bookingDate, today),
                    ne(bookings.status, "cancelled")
                )
            ),
        db
            .select({
                count: sql`count(*)`.as("count"),
                revenue: sql`coalesce(sum(${bookings.totalPrice}), 0)`.as("revenue"),
            })
            .from(bookings)
            .where(
                and(
                    gte(bookings.bookingDate, weekStart),
                    lte(bookings.bookingDate, today),
                    ne(bookings.status, "cancelled")
                )
            ),
        db
            .select({
                count: sql`count(*)`.as("count"),
                revenue: sql`coalesce(sum(${bookings.totalPrice}), 0)`.as("revenue"),
            })
            .from(bookings)
            .where(
                and(
                    gte(bookings.bookingDate, monthStart),
                    lte(bookings.bookingDate, today),
                    ne(bookings.status, "cancelled")
                )
            ),
        db
            .select({ count: sql`count(*)`.as("count") })
            .from(pitches)
            .where(eq(pitches.isActive, true)),
    ]);

    const todayBookings = Number(todayRows[0]?.count ?? 0);
    const todayRevenue = Number(todayRows[0]?.revenue ?? 0);
    const weekRevenue = Number(weekRows[0]?.revenue ?? 0);
    const monthRevenue = Number(monthRows[0]?.revenue ?? 0);
    const pitchCount = Number(activePitches[0]?.count ?? 0);

    // Occupancy = today's bookings ÷ (bookable blocks on active pitches).
    // Only count blocks belonging to active pitches.
    const bookableBlocksPerPitch = await db
        .select({
            pitchId: timeBlocks.pitchId,
            count: sql`count(*)`.as("count"),
        })
        .from(timeBlocks)
        .innerJoin(pitches, eq(timeBlocks.pitchId, pitches.id))
        .where(and(eq(timeBlocks.isGap, false), eq(pitches.isActive, true)))
        .groupBy(timeBlocks.pitchId);

    const totalSlotsToday = bookableBlocksPerPitch.reduce(
        (acc, r) => acc + Number(r.count ?? 0),
        0
    );
    const occupancy =
        totalSlotsToday === 0
            ? 0
            : Math.round((todayBookings / totalSlotsToday) * 100);

    return {
        todayBookings,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        occupancy,
        activePitches: pitchCount,
    };
}

/* -------------------------------------------------------------- */
/* Bookings list                                                   */
/* -------------------------------------------------------------- */

export async function getAllBookings({ dateFrom, dateTo, pitchId, status } = {}) {
    await requireAdmin();

    const conditions = [];
    if (dateFrom) conditions.push(gte(bookings.bookingDate, dateFrom));
    if (dateTo) conditions.push(lte(bookings.bookingDate, dateTo));
    if (pitchId) conditions.push(eq(bookings.pitchId, pitchId));
    if (status) conditions.push(eq(bookings.status, status));

    const rows = await db
        .select({
            id: bookings.id,
            bookingDate: bookings.bookingDate,
            startTime: bookings.startTime,
            endTime: bookings.endTime,
            totalPrice: bookings.totalPrice,
            status: bookings.status,
            paymentMethod: bookings.paymentMethod,
            paymentStatus: bookings.paymentStatus,
            bkashTrxID: bookings.bkashTrxID,
            createdAt: bookings.createdAt,
            pitchId: bookings.pitchId,
            pitchName: pitches.name,
            pitchSport: pitches.sport,
            userId: bookings.userId,
            userName: user.name,
            userEmail: user.email,
        })
        .from(bookings)
        .innerJoin(pitches, eq(bookings.pitchId, pitches.id))
        .innerJoin(user, eq(bookings.userId, user.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(bookings.bookingDate), desc(bookings.startTime))
        .limit(500);

    return rows.map((r) => ({
        ...r,
        totalPrice: String(r.totalPrice),
        createdAt: r.createdAt?.toISOString?.() ?? null,
    }));
}

export async function getTodayBookings() {
    await requireAdmin();
    const today = todayKey();
    return getAllBookings({ dateFrom: today, dateTo: today });
}

/* -------------------------------------------------------------- */
/* Booking mutations                                               */
/* -------------------------------------------------------------- */

export async function adminCancelBooking(bookingId) {
    await requireAdmin();

    await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, bookingId));

    revalidateAdminAll();
    return { ok: true };
}

/* -------------------------------------------------------------- */
/* Pitches                                                         */
/* -------------------------------------------------------------- */

export async function getAllPitchesAdmin() {
    await requireAdmin();

    const rows = await db.select().from(pitches).orderBy(pitches.createdAt);
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
        createdAt: p.createdAt?.toISOString?.() ?? null,
    }));
}

export async function togglePitchActive(pitchId) {
    await requireAdmin();

    const [row] = await db
        .select({ isActive: pitches.isActive })
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);

    if (!row) throw new Error("Pitch not found");

    await db
        .update(pitches)
        .set({ isActive: !row.isActive })
        .where(eq(pitches.id, pitchId));

    revalidateAdminAll();
    return { ok: true, isActive: !row.isActive };
}

export async function upsertPitch({
    id,
    name,
    description,
    sport,
    hourlyRate,
    openHour,
    closeHour,
    defaultSlotMinutes,
    imageUrl,
    isActive,
}) {
    await requireAdmin();

    if (!name || hourlyRate == null) {
        throw new Error("Name and hourly rate required");
    }
    if (!SPORTS.includes(sport)) {
        throw new Error("Invalid sport.");
    }

    const oh = Number(openHour);
    const ch = Number(closeHour);
    // Accept 0–23 for both. 0 is a valid hour (midnight).
    if (!Number.isInteger(oh) || oh < 0 || oh > 23) {
        throw new Error("Invalid opening hour.");
    }
    if (!Number.isInteger(ch) || ch < 0 || ch > 23) {
        throw new Error("Invalid closing hour.");
    }
    // openHour === closeHour is only valid if the pitch runs a full 24h,
    // which isn't supported here. Reject to avoid an empty grid.
    if (oh === ch) {
        throw new Error("Opening and closing hour cannot be the same.");
    }

    const dsm = Number(defaultSlotMinutes);
    if (!Number.isInteger(dsm) || dsm < 15 || dsm > 240) {
        throw new Error("Default slot duration must be 15–240 minutes.");
    }

    const values = {
        name,
        description: description ?? null,
        sport,
        hourlyRate: String(hourlyRate),
        openHour: oh,
        closeHour: ch,
        defaultSlotMinutes: dsm,
        imageUrl: imageUrl ?? null,
        isActive: isActive ?? true,
    };

    let pitchId = id;

    if (id) {
        await db.update(pitches).set(values).where(eq(pitches.id, id));
    } else {
        const [row] = await db.insert(pitches).values(values).returning();
        pitchId = row.id;

        // Auto-generate the default block sequence for the new pitch.
        const generated = generateDefaultBlocks({
            openHour: oh,
            closeHour: ch,
            defaultSlotMinutes: dsm,
            hourlyRate,
        });
        await db.insert(timeBlocks).values(
            generated.map((b) => ({
                pitchId,
                startTime: b.startTime,
                endTime: b.endTime,
                price: b.price,
                isGap: b.isGap,
                sortOrder: b.sortOrder,
                isActive: true,
            }))
        );
    }

    revalidateAdminAll();
    return { ok: true, pitchId };
}

/* -------------------------------------------------------------- */
/* Time blocks (per pitch)                                         */
/* -------------------------------------------------------------- */

export async function getPitchBlocks(pitchId) {
    await requireAdmin();

    const [pitch] = await db
        .select()
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);
    if (!pitch) throw new Error("Pitch not found");

    const rows = await db
        .select()
        .from(timeBlocks)
        .where(eq(timeBlocks.pitchId, pitchId))
        .orderBy(asc(timeBlocks.sortOrder));

    return {
        pitch: {
            id: pitch.id,
            name: pitch.name,
            sport: pitch.sport,
            openHour: pitch.openHour,
            closeHour: pitch.closeHour,
            defaultSlotMinutes: pitch.defaultSlotMinutes,
            hourlyRate: String(pitch.hourlyRate),
        },
        blocks: rows.map((b) => ({
            id: b.id,
            startTime: b.startTime,
            endTime: b.endTime,
            price: String(b.price),
            isGap: b.isGap,
            sortOrder: b.sortOrder,
            isActive: b.isActive,
        })),
    };
}

/**
 * Regenerate the default block sequence for a pitch, wiping existing blocks.
 * Also re-derives openHour / closeHour from the pitch's current fields.
 */
export async function regeneratePitchBlocks(pitchId) {
    await requireAdmin();

    const [pitch] = await db
        .select()
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);
    if (!pitch) throw new Error("Pitch not found");

    const generated = generateDefaultBlocks({
        openHour: pitch.openHour,
        closeHour: pitch.closeHour,
        defaultSlotMinutes: pitch.defaultSlotMinutes,
        hourlyRate: Number(pitch.hourlyRate),
    });

    await db.delete(timeBlocks).where(eq(timeBlocks.pitchId, pitchId));
    await db.insert(timeBlocks).values(
        generated.map((b) => ({
            pitchId,
            startTime: b.startTime,
            endTime: b.endTime,
            price: b.price,
            isGap: b.isGap,
            sortOrder: b.sortOrder,
            isActive: true,
        }))
    );

    revalidateAdminAll();
    return { ok: true };
}

/**
 * Replace the entire block sequence for a pitch in one shot.
 * The admin editor works on a draft array and saves the whole thing.
 *
 * After saving, the pitch's openHour / closeHour are re-derived from the
 * new sequence — so extending the last block auto-moves the closing time
 * (e.g. 03:00 → 03:30).
 *
 * @param {string} pitchId
 * @param {Array<{startTime,endTime,price,isGap,sortOrder}>} blocks
 */
export async function replacePitchBlocks(pitchId, blocks) {
    await requireAdmin();

    const [pitch] = await db
        .select()
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);
    if (!pitch) throw new Error("Pitch not found");

    const normalized = (blocks || []).map((b, i) => ({
        startTime: String(b.startTime),
        endTime: String(b.endTime),
        price: b.isGap ? "0" : String(b.price ?? "0"),
        isGap: Boolean(b.isGap),
        sortOrder: i,
    }));

    const check = validateBlocks(normalized);
    if (!check.ok) throw new Error(check.error);

    // Derive the pitch's new business hours from the block sequence.
    const { openHour, closeHour } = deriveHours(normalized);

    // Delete + reinsert. Bookings already have snapshots so history is safe.
    await db.delete(timeBlocks).where(eq(timeBlocks.pitchId, pitchId));
    if (normalized.length > 0) {
        await db.insert(timeBlocks).values(
            normalized.map((b) => ({
                pitchId,
                startTime: b.startTime,
                endTime: b.endTime,
                price: b.price,
                isGap: b.isGap,
                sortOrder: b.sortOrder,
                isActive: true,
            }))
        );
    }

    // Persist derived hours on the pitch. This is what makes "extend the
    // last block → closing time moves to 03:30" actually stick.
    await db
        .update(pitches)
        .set({ openHour, closeHour })
        .where(eq(pitches.id, pitchId));

    revalidateAdminAll();
    return { ok: true, openHour, closeHour };
}