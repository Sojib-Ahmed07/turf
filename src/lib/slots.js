// src/lib/slots.js
/* -------------------------------------------------------------- */
/* Slot / block engine                                             */
/*                                                               */
/* Pure functions only — no DB access.                             */
/*                                                               */
/* Model:                                                          */
/*   - A pitch's day is a contiguous sequence of blocks.           */
/*   - Each block has { startTime, endTime, price, isGap }.        */
/*   - Gaps are explicit blocks with isGap = true (price 0).       */
/*   - openHour  = hour of first block's startTime                 */
/*   - closeHour = hour of last block's endTime                    */
/*   - Extending a block absorbs following gap time; if none,      */
/*     shifts all following blocks right; if that pushes past      */
/*     the last block's end, closeHour grows with it.              */
/*   - Shrinking a block leaves the following blocks in place and  */
/*     converts the freed time into a gap (grown if one exists).   */
/* -------------------------------------------------------------- */

export const MIN_SLOT_MINUTES = 15;
export const MAX_SLOT_MINUTES = 8 * 60; // 8 hours max per block

/* ---- time math ---- */

export function hhmmToMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

export function minutesToHHMM(mins) {
    const m = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function minutesBetween(startHHMM, endHHMM) {
    let s = hhmmToMinutes(startHHMM);
    let e = hhmmToMinutes(endHHMM);
    if (e <= s) e += 1440;
    return e - s;
}

/**
 * Total window in minutes from first block start to last block end.
 * Works across midnight; returns an absolute duration.
 */
export function sequenceMinutes(blocks) {
    if (!blocks.length) return 0;
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    return minutesBetween(first.startTime, last.endTime) === 0
        ? 0
        : hhmmToMinutesOffset(last.endTime, first.startTime) -
        hhmmToMinutesOffset(first.startTime, first.startTime);
}

function hhmmToMinutesOffset(hhmm, originHHMM) {
    const t = hhmmToMinutes(hhmm);
    const o = hhmmToMinutes(originHHMM);
    return t >= o ? t : t + 1440;
}

/* ---- generation ---- */

/**
 * Generate a fresh sequence of bookable blocks.
 * @returns {Array<{startTime,endTime,price,isGap,sortOrder}>}
 */
export function generateDefaultBlocks({
    openHour = 6,
    closeHour = 3,
    defaultSlotMinutes = 90,
    hourlyRate = 0,
}) {
    const openMins = openHour * 60;
    const span = ((closeHour - openHour + 24) % 24) * 60;
    const total = span === 0 ? 24 * 60 : span;

    const blocks = [];
    let offset = 0;
    let order = 0;

    while (offset + defaultSlotMinutes <= total) {
        const startMins = openMins + offset;
        const endMins = startMins + defaultSlotMinutes;
        const price = Math.round((Number(hourlyRate) * defaultSlotMinutes) / 60);
        blocks.push({
            startTime: minutesToHHMM(startMins),
            endTime: minutesToHHMM(endMins),
            price: String(price),
            isGap: false,
            sortOrder: order++,
        });
        offset += defaultSlotMinutes;
    }

    const leftover = total - offset;
    if (leftover >= MIN_SLOT_MINUTES) {
        const startMins = openMins + offset;
        const endMins = startMins + leftover;
        const price = Math.round((Number(hourlyRate) * leftover) / 60);
        blocks.push({
            startTime: minutesToHHMM(startMins),
            endTime: minutesToHHMM(endMins),
            price: String(price),
            isGap: false,
            sortOrder: order++,
        });
    }

    return blocks;
}

/* ---- hour derivation ---- */

/**
 * Derive { openHour, closeHour } from a block sequence.
 * openHour is the hour (0–23) of the first block's startTime.
 * closeHour is the hour of the last block's endTime; if endTime is 00:00
 * we return 0, and the pitch form treats closeHour <= openHour as crossing
 * midnight.
 */
export function deriveHours(blocks) {
    if (!blocks.length) return { openHour: 6, closeHour: 3 };
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    const openHour = Math.floor(hhmmToMinutes(first.startTime) / 60);
    const lastEnd = hhmmToMinutes(last.endTime);
    const closeHour = Math.floor(lastEnd / 60);
    return { openHour, closeHour };
}

/* ---- validation ---- */

/**
 * Validate a sequence of blocks.
 * Rules:
 *   - at least one block, at least one non-gap
 *   - contiguous (no implicit gap; every block's start == previous end)
 *   - each block duration >= MIN and <= MAX
 *   - first block startTime is on the hour or half-hour (allow 00/15/30/45)
 *   - non-gap blocks have price > 0
 */
export function validateBlocks(blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) {
        return { ok: false, error: "At least one block is required." };
    }
    if (!blocks.some((b) => !b.isGap)) {
        return { ok: false, error: "At least one bookable (non-gap) block is required." };
    }

    const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

    for (let i = 0; i < sorted.length; i++) {
        const b = sorted[i];
        const dur = minutesBetween(b.startTime, b.endTime);
        if (dur < MIN_SLOT_MINUTES) {
            return {
                ok: false,
                error: `Block ${b.startTime}–${b.endTime} is shorter than ${MIN_SLOT_MINUTES} min.`,
            };
        }
        if (dur > MAX_SLOT_MINUTES) {
            return {
                ok: false,
                error: `Block ${b.startTime}–${b.endTime} is longer than ${MAX_SLOT_MINUTES / 60}h.`,
            };
        }
        if (!b.isGap && Number(b.price) <= 0) {
            return {
                ok: false,
                error: `Block ${b.startTime}–${b.endTime} needs a price greater than 0.`,
            };
        }
        if (i > 0) {
            const prev = sorted[i - 1];
            if (b.startTime !== prev.endTime) {
                return {
                    ok: false,
                    error: `Gap between ${prev.endTime} and ${b.startTime}. Blocks must be contiguous.`,
                };
            }
        }
    }

    return { ok: true };
}

/* ---- resize ---- */

/**
 * Resize a block by deltaMinutes. Positive extends, negative shrinks.
 *
 * Extend (+Δ):
 *   - Absorb from the following gap if one exists.
 *   - Otherwise shift every following block right by Δ.
 *   - If the last block now ends past its previous end, closeHour grows.
 *
 * Shrink (−Δ):
 *   - Convert the freed Δ minutes into a gap immediately after the block.
 *   - If a gap already follows, grow it by Δ.
 *   - If the block is last, the freed time is a gap at the end.
 *
 * Returns { blocks, note }.
 */
export function applyResize(blocks, index, deltaMinutes) {
    if (!blocks[index]) return { blocks, note: null };
    const working = blocks.map((b) => ({ ...b }));
    const target = working[index];

    const origDur = minutesBetween(target.startTime, target.endTime);
    const newDur = origDur + deltaMinutes;

    if (newDur < MIN_SLOT_MINUTES) {
        return { blocks, note: `Minimum block length is ${MIN_SLOT_MINUTES} min.` };
    }
    if (newDur > MAX_SLOT_MINUTES) {
        return { blocks, note: `Maximum block length is ${MAX_SLOT_MINUTES / 60}h.` };
    }

    const targetStartMins = hhmmToMinutes(target.startTime);
    const targetEndMins = targetStartMins + newDur;

    // Set new end time on target
    target.endTime = minutesToHHMM(targetEndMins);

    let note = null;

    if (deltaMinutes > 0) {
        // ---- EXTEND ----
        let remaining = deltaMinutes;

        // 1. Absorb from the following gap, if any.
        const next = working[index + 1];
        if (next && next.isGap) {
            const gapDur = minutesBetween(next.startTime, next.endTime);
            const absorbed = Math.min(gapDur, remaining);
            remaining -= absorbed;

            if (absorbed >= gapDur) {
                // Remove the gap entirely
                working.splice(index + 1, 1);
            } else {
                // Shrink the gap
                next.startTime = minutesToHHMM(
                    hhmmToMinutes(next.startTime) + absorbed
                );
                // after absorbing, target.endTime === next.startTime
            }
        }

        // 2. If anything remains, shift all following blocks right.
        if (remaining > 0) {
            for (let i = index + 1; i < working.length; i++) {
                const b = working[i];
                b.startTime = minutesToHHMM(hhmmToMinutes(b.startTime) + remaining);
                b.endTime = minutesToHHMM(hhmmToMinutes(b.endTime) + remaining);
            }
            note = "Close time extended to fit the longer block.";
        } else if (deltaMinutes > 0) {
            note = "Absorbed from the following buffer.";
        }
    } else if (deltaMinutes < 0) {
        // ---- SHRINK ----
        const freed = -deltaMinutes;

        // Look at what follows.
        const next = working[index + 1];
        if (next && next.isGap) {
            // Grow existing gap leftward: it starts where target now ends.
            next.startTime = minutesToHHMM(targetEndMins);
        } else {
            // Insert a new gap of `freed` minutes right after target.
            const newGap = {
                id: `gap-${Date.now()}-${index}`,
                startTime: minutesToHHMM(targetEndMins),
                endTime: minutesToHHMM(targetEndMins + freed),
                price: "0",
                isGap: true,
                sortOrder: index + 1,
            };
            working.splice(index + 1, 0, newGap);
        }
        note = `Created a ${freed} min buffer.`;
    }

    // Renumber
    working.forEach((b, i) => (b.sortOrder = i));

    return { blocks: working, note };
}

/* ---- delete / toggle ---- */

/** Convert a block to a gap, keeping its duration. */
export function convertToGap(blocks, index) {
    return blocks.map((b, i) =>
        i === index ? { ...b, isGap: true, price: "0" } : b
    );
}

export function convertToBookable(blocks, index) {
    return blocks.map((b, i) => (i === index ? { ...b, isGap: false } : b));
}

/**
 * Delete a block and merge its time into the previous block.
 * If it's the first block, merge into the next.
 * If it's the only block, return an empty array.
 */
export function deleteBlock(blocks, index) {
    const working = blocks.map((b) => ({ ...b }));
    const target = working[index];
    if (!target) return working;

    const targetDur = minutesBetween(target.startTime, target.endTime);

    if (working.length === 1) {
        return [];
    }

    if (index > 0) {
        // Extend previous block by target's duration
        const prev = working[index - 1];
        prev.endTime = minutesToHHMM(hhmmToMinutes(prev.endTime) + targetDur);
        working.splice(index, 1);
    } else {
        // First block: pull the next block's start back
        const next = working[1];
        next.startTime = target.startTime;
        working.splice(0, 1);
    }

    working.forEach((b, i) => (b.sortOrder = i));
    return working;
}

/* ---- formatting ---- */

export function format12h(hhmm) {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function format12hRange(startTime, endTime) {
    return `${format12h(startTime)} – ${format12h(endTime)}`;
}