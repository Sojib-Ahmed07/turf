// src/db/pitch-schema.js
import { pgTable, text, boolean, timestamp, decimal, integer, uuid } from "drizzle-orm/pg-core";

export const SPORTS = ["football", "cricket", "badminton", "swimming_pool"];

export const pitches = pgTable("pitches", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    // One of SPORTS. Free text at DB level, validated in app layer.
    sport: text("sport").notNull().default("football"),
    // Base rate used as a hint when generating default block prices.
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
    // Business hours for this pitch. closeHour <= openHour ⇒ crosses midnight.
    openHour: integer("open_hour").notNull().default(6),
    closeHour: integer("close_hour").notNull().default(3),
    // Default duration used when generating the initial slot grid.
    defaultSlotMinutes: integer("default_slot_minutes").notNull().default(90),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});