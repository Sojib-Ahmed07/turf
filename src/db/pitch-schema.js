// src/db/pitch-schema.js
import {
    pgTable,
    text,
    boolean,
    timestamp,
    decimal,
    integer,
    uuid,
    jsonb,
} from "drizzle-orm/pg-core";

export const SPORTS = ["football", "cricket", "badminton", "swimming_pool"];

export const pitches = pgTable("pitches", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    sport: text("sport").notNull().default("football"),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
    openHour: integer("open_hour").notNull().default(6),
    closeHour: integer("close_hour").notNull().default(3),
    defaultSlotMinutes: integer("default_slot_minutes").notNull().default(90),
    // The pitch-wide default block template. Array of
    // { startTime, endTime, price }. Applied to any date that has no
    // per-date override in time_blocks.
    defaultBlocks: jsonb("default_blocks").notNull().default([]),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});