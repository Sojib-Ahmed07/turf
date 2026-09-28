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
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { pitches } from "./pitch-schema.js";

export const timeBlocks = pgTable(
    "time_blocks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        pitchId: uuid("pitch_id")
            .notNull()
            .references(() => pitches.id, { onDelete: "cascade" }),
        // "YYYY-MM-DD". A row exists only for dates that OVERRIDE the
        // pitch's defaultBlocks. Dates without rows fall back to default.
        date: text("date").notNull(),
        startTime: text("start_time").notNull(),
        endTime: text("end_time").notNull(),
        price: decimal("price", { precision: 10, scale: 2 })
            .notNull()
            .default("0"),
        sortOrder: integer("sort_order").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        pitchDateIdx: index("time_blocks_pitch_date_idx").on(
            table.pitchId,
            table.date,
            table.sortOrder
        ),
        uniquePerDate: uniqueIndex("time_blocks_pitch_date_order_idx").on(
            table.pitchId,
            table.date,
            table.sortOrder
        ),
    })
);