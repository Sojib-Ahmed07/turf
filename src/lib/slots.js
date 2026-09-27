// src/lib/slots.js
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { bookings } from "../db/booking-schema.js";
import { generateTimeSlots, toDateKey, nowTimeKey } from "./time.js";

/**
 * Full slot grid for a pitch on a given date, with flags.
 *
 * Cross-midnight slots (e.g. 12:00 AM – 1:30 AM) are still stored under
 * the *starting* day's date. So a slot starting at 00:00 on 2025-01-15
 * belongs to bookingDate "2025-01-15".
 */
export async function getSlotsForDay(pitchId, dateKey) {
    const booked = await db
        .select({ startTime: bookings.startTime })
        .from(bookings)
        .where(
            and(
                eq(bookings.pitchId, pitchId),
                eq(bookings.bookingDate, dateKey),
                eq(bookings.status, "confirmed")
            )
        );
    const bookedSet = new Set(booked.map((b) => b.startTime));

    const todayKey = toDateKey(new Date());
    const nowKey = nowTimeKey();
    const isPastDay = dateKey < todayKey;
    const isToday = dateKey === todayKey;

    return generateTimeSlots().map(({ startTime, endTime, crossesMidnight }) => {
        const isBooked = bookedSet.has(startTime);

        // A slot is "past" if:
        //   - it's a past day, OR
        //   - it's today and the start time is already behind us
        //     (cross-midnight slots on today's date are still future — skip that check)
        const isPast =
            isPastDay ||
            (isToday && !crossesMidnight && startTime <= nowKey);

        return {
            startTime,
            endTime,
            crossesMidnight,
            isBooked,
            isPast,
            isBookable: !isBooked && !isPast,
        };
    });
}