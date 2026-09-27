// src/lib/slots.js
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { bookings } from "../db/booking-schema.js";
import { generateTimeSlots, toDateKey, nowTimeKey } from "./time.js";

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

    return generateTimeSlots().map(({ startTime, endTime }) => {
        const isBooked = bookedSet.has(startTime);
        const isPast = isPastDay || (isToday && startTime <= nowKey);
        return {
            startTime,
            endTime,
            isBooked,
            isPast,
            isBookable: !isBooked && !isPast,
        };
    });
}