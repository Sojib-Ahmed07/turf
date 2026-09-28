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
    cloneAsTemplate,
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

/** Returns ["YYYY-MM-DD", ...] for today + next (n-1) days. */
function nextDateKeys(n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(dateKeyPlus(i));
    return out;
}

function revalidateAdminAll() {
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/pitches");
    revalidatePath("/book");
}

/** Normalize an incoming block array from the client. */
function normalizeBlocks(blocks) {
    return (blocks || []).map((b, i) => ({
        startTime: String(b.startTime),
        endTime: String(b.endTime),
        price: String(b.price ?? "0"),
        sortOrder: i,
    }));
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

    // Occupancy: use the DEFAULT template block count per active pitch as
    // the "total slots per day" baseline (overrides are rare edge cases).
    const pitchRows = await db
        .select({ defaultBlocks: pitches.defaultBlocks })
        .from(pitches)
        .where(eq(pitches.isActive, true));

    const totalSlotsToday = pitchRows.reduce(
        (acc, r) => acc + (Array.isArray(r.defaultBlocks) ? r.defaultBlocks.length : 0),
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
        defaultBlocks: Array.isArray(p.defaultBlocks) ? p.defaultBlocks : [],
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
    if (!Number.isInteger(oh) || oh < 0 || oh > 23) {
        throw new Error("Invalid opening hour.");
    }
    if (!Number.isInteger(ch) || ch < 0 || ch > 23) {
        throw new Error("Invalid closing hour.");
    }
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
        // Generate default template on creation
        const generated = generateDefaultBlocks({
            openHour: oh,
            closeHour: ch,
            defaultSlotMinutes: dsm,
            hourlyRate,
        });
        const template = generated.map((b, i) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            price: String(b.price),
            sortOrder: i,
        }));

        const [row] = await db
            .insert(pitches)
            .values({ ...values, defaultBlocks: template })
            .returning();
        pitchId = row.id;
    }

    revalidateAdminAll();
    return { ok: true, pitchId };
}

/* -------------------------------------------------------------- */
/* Block editor — data loading                                     */
/* -------------------------------------------------------------- */

/**
 * Load block editor data for a pitch:
 *   - the pitch's DEFAULT template
 *   - three days: today, +1, +2 with their current (override or default) blocks
 *   - which of those dates currently has an override
 */
export async function getPitchBlocksEditorData(pitchId) {
    await requireAdmin();

    const [pitch] = await db
        .select()
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);
    if (!pitch) throw new Error("Pitch not found");

    const dates = nextDateKeys(3);

    const overrideRows = await db
        .select()
        .from(timeBlocks)
        .where(
            and(
                eq(timeBlocks.pitchId, pitchId),
                sql`${timeBlocks.date} in (${sql.join(dates.map((d) => sql`${d}`), sql`, `)})`
            )
        )
        .orderBy(asc(timeBlocks.date), asc(timeBlocks.sortOrder));

    const byDate = new Map();
    for (const r of overrideRows) {
        if (!byDate.has(r.date)) byDate.set(r.date, []);
        byDate.get(r.date).push({
            id: r.id,
            startTime: r.startTime,
            endTime: r.endTime,
            price: String(r.price),
            sortOrder: r.sortOrder,
        });
    }

    const defaultTemplate = Array.isArray(pitch.defaultBlocks)
        ? pitch.defaultBlocks.map((b, i) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            price: String(b.price),
            sortOrder: i,
        }))
        : [];

    const days = dates.map((date) => {
        const override = byDate.get(date) || null;
        return {
            date,
            isOverride: override !== null,
            blocks: override ?? defaultTemplate,
        };
    });

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
        defaultBlocks: defaultTemplate,
        days,
    };
}

/* -------------------------------------------------------------- */
/* Block editor — mutations                                        */
/* -------------------------------------------------------------- */

/**
 * Replace the pitch's DEFAULT template.
 */
export async function replaceDefaultBlocks(pitchId, blocks) {
    await requireAdmin();

    const [pitch] = await db
        .select()
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);
    if (!pitch) throw new Error("Pitch not found");

    const normalized = normalizeBlocks(blocks);
    const check = validateBlocks(normalized);
    if (!check.ok) throw new Error(check.error);

    const { openHour, closeHour } = deriveHours(normalized);

    await db
        .update(pitches)
        .set({
            defaultBlocks: normalized.map((b) => ({
                startTime: b.startTime,
                endTime: b.endTime,
                price: b.price,
                sortOrder: b.sortOrder,
            })),
            openHour,
            closeHour,
        })
        .where(eq(pitches.id, pitchId));

    revalidateAdminAll();
    return { ok: true };
}

/**
 * Replace the block OVERRIDE for a specific date.
 */
export async function replaceDateBlocks(pitchId, date, blocks) {
    await requireAdmin();

    const [pitch] = await db
        .select()
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);
    if (!pitch) throw new Error("Pitch not found");

    const normalized = normalizeBlocks(blocks);
    const check = validateBlocks(normalized);
    if (!check.ok) throw new Error(check.error);

    await db
        .delete(timeBlocks)
        .where(and(eq(timeBlocks.pitchId, pitchId), eq(timeBlocks.date, date)));

    if (normalized.length > 0) {
        await db.insert(timeBlocks).values(
            normalized.map((b) => ({
                pitchId,
                date,
                startTime: b.startTime,
                endTime: b.endTime,
                price: b.price,
                sortOrder: b.sortOrder,
                isActive: true,
            }))
        );
    }

    revalidateAdminAll();
    return { ok: true };
}

/**
 * Remove the OVERRIDE for a date — the pitch's default template kicks in.
 */
export async function resetDateToDefault(pitchId, date) {
    await requireAdmin();

    await db
        .delete(timeBlocks)
        .where(and(eq(timeBlocks.pitchId, pitchId), eq(timeBlocks.date, date)));

    revalidateAdminAll();
    return { ok: true };
}

/**
 * Seed the pitch's default template from a fresh grid using the pitch's
 * openHour / closeHour / defaultSlotMinutes / hourlyRate.
 */
export async function regenerateDefaultBlocks(pitchId) {
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

    const template = generated.map((b, i) => ({
        startTime: b.startTime,
        endTime: b.endTime,
        price: String(b.price),
        sortOrder: i,
    }));

    await db
        .update(pitches)
        .set({ defaultBlocks: template })
        .where(eq(pitches.id, pitchId));

    revalidateAdminAll();
    return { ok: true };
}

/**
 * Seed a specific date's override from the pitch's default template.
 * Useful when admin wants to "fork" a day and tweak it.
 */
export async function seedDateFromDefault(pitchId, date) {
    await requireAdmin();

    const [pitch] = await db
        .select()
        .from(pitches)
        .where(eq(pitches.id, pitchId))
        .limit(1);
    if (!pitch) throw new Error("Pitch not found");

    const template = Array.isArray(pitch.defaultBlocks)
        ? cloneAsTemplate(pitch.defaultBlocks.map((b, i) => ({ ...b, sortOrder: i })))
        : [];

    await db
        .delete(timeBlocks)
        .where(and(eq(timeBlocks.pitchId, pitchId), eq(timeBlocks.date, date)));

    if (template.length > 0) {
        await db.insert(timeBlocks).values(
            template.map((b) => ({
                pitchId,
                date,
                startTime: b.startTime,
                endTime: b.endTime,
                price: b.price,
                sortOrder: b.sortOrder,
                isActive: true,
            }))
        );
    }

    revalidateAdminAll();
    return { ok: true };
}