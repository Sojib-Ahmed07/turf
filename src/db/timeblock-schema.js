// src/db/timeblock-schema.js
import {
    pgTable,
    text,
    boolean,
    timestamp,
    decimal,
    integer,
    uuid,
    index,
} from "drizzle-orm/pg-core";
import { pitches } from "./pitch-schema.js";

export const timeBlocks = pgTable(
    "time_blocks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        pitchId: uuid("pitch_id")
            .notNull()
            .references(() => pitches.id, { onDelete: "cascade" }),
        // "HH:MM" 24h, may cross midnight (e.g. "00:30"). Belongs to the
        // starting business day.
        startTime: text("start_time").notNull(),
        endTime: text("end_time").notNull(),
        // Price for this specific block. Ignored (0) when isGap = true.
        price: decimal("price", { precision: 10, scale: 2 })
            .notNull()
            .default("0"),
        // A gap is a non-bookable buffer between bookable slots.
        isGap: boolean("is_gap").notNull().default(false),
        // Stable ordering of blocks within a pitch's day.
        sortOrder: integer("sort_order").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        pitchIdx: index("time_blocks_pitch_idx").on(table.pitchId, table.sortOrder),
    })
);