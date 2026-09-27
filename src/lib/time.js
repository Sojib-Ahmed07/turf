// src/lib/time.js
export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 23;

/** [{ startTime: "06:00", endTime: "07:00" }, ...] */
export function generateTimeSlots() {
    const out = [];
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
        out.push({
            startTime: `${String(h).padStart(2, "0")}:00`,
            endTime: `${String(h + 1).padStart(2, "0")}:00`,
        });
    }
    return out;
}

export function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function nowTimeKey() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}