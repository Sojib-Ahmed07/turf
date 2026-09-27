// src/lib/time.js

/* -------------------------------------------------------------- */
/* Business hours (24h format, internal use)                       */
/* -------------------------------------------------------------- */

export const OPEN_HOUR = 6;       // 6:00 AM
export const CLOSE_HOUR = 3;      // 3:00 AM next day
export const SLOT_MINUTES = 90;   // each slot is 90 minutes

/** Total slots per day across the full window (6:00 AM → 1:30 AM next day) */
export const SLOTS_PER_DAY = 14;  // 6:00, 7:30, 9:00, 10:30, 12:00, 13:30,
// 15:00, 16:30, 18:00, 19:30, 21:00, 22:30,
// 00:00, 01:30

/* -------------------------------------------------------------- */
/* Internal helpers                                                */
/* -------------------------------------------------------------- */

/** Minutes → "HH:MM" (24h) */
function minutesToHHMM(mins) {
    const m = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** "HH:MM" → total minutes */
function hhmmToMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

/* -------------------------------------------------------------- */
/* Slot generation                                                 */
/* -------------------------------------------------------------- */

/**
 * Returns the full slot grid for a day.
 * Slots cross midnight — the last slot ends at 3:00 AM next day.
 *
 * Each slot has: { startTime, endTime, crossesMidnight }
 *   - startTime / endTime are 24h "HH:MM" strings (for DB + sorting)
 *   - crossesMidnight = true when endTime is in the AM (next day)
 */
export function generateTimeSlots() {
    const slots = [];
    const startMinutes = OPEN_HOUR * 60;
    // window length = (24 - OPEN_HOUR + CLOSE_HOUR) * 60
    const windowMinutes = (24 - OPEN_HOUR + CLOSE_HOUR) * 60;

    for (let offset = 0; offset < windowMinutes; offset += SLOT_MINUTES) {
        const startMins = startMinutes + offset;
        const endMins = startMins + SLOT_MINUTES;
        const startTime = minutesToHHMM(startMins);
        const endTime = minutesToHHMM(endMins);
        // A slot "crosses midnight" if its start time is after 23:59
        // (i.e. its raw startMins > 1440)
        const crossesMidnight = startMins >= 1440;
        slots.push({ startTime, endTime, crossesMidnight });
    }
    return slots;
}

/* -------------------------------------------------------------- */
/* Date helpers                                                    */
/* -------------------------------------------------------------- */

/** Local Date → "YYYY-MM-DD" */
export function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Current time as "HH:MM" (24h, local) */
export function nowTimeKey() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/* -------------------------------------------------------------- */
/* Display helpers (12-hour AM/PM)                                 */
/* -------------------------------------------------------------- */

/**
 * Convert 24h "HH:MM" → "h:MM AM/PM"
 * e.g. "13:00" → "1:00 PM", "00:30" → "12:30 AM"
 */
export function format12h(hhmm) {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/**
 * Full 12h range for a slot: "6:00 PM – 7:30 PM"
 */
export function format12hRange(startTime, endTime) {
    return `${format12h(startTime)} – ${format12h(endTime)}`;
}