// src/app/actions/admin.js
"use server";

import { db } from "@/db";
import { bookings, pitches } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq, desc, gte, lte, sql, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/* -------------------------------------------------------------- */
/* Constants (kept inside functions, since "use server" files     */
/* may only export async functions)                               */
/* -------------------------------------------------------------- */

const OPEN_HOUR = 6;
const CLOSE_HOUR = 23;

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

    const SLOTS_PER_DAY = CLOSE_HOUR - OPEN_HOUR; // 17
    const totalSlotsToday = pitchCount * SLOTS_PER_DAY;
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
            createdAt: bookings.createdAt,
            pitchId: bookings.pitchId,
            pitchName: pitches.name,
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

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    return { ok: true };
}

export async function adminMarkPaid(bookingId) {
    await requireAdmin();

    await db
        .update(bookings)
        .set({ paymentStatus: "paid" })
        .where(eq(bookings.id, bookingId));

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
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
        hourlyRate: String(p.hourlyRate),
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

    revalidatePath("/admin/pitches");
    revalidatePath("/admin");
    return { ok: true, isActive: !row.isActive };
}

export async function upsertPitch({
    id,
    name,
    description,
    hourlyRate,
    imageUrl,
    isActive,
}) {
    await requireAdmin();

    if (!name || hourlyRate == null) {
        throw new Error("Name and hourly rate required");
    }

    if (id) {
        await db
            .update(pitches)
            .set({
                name,
                description: description ?? null,
                hourlyRate: String(hourlyRate),
                imageUrl: imageUrl ?? null,
                isActive: isActive ?? true,
            })
            .where(eq(pitches.id, id));
    } else {
        await db.insert(pitches).values({
            name,
            description: description ?? null,
            hourlyRate: String(hourlyRate),
            imageUrl: imageUrl ?? null,
            isActive: isActive ?? true,
        });
    }

    revalidatePath("/admin/pitches");
    return { ok: true };
}