// src/db/pitch-schema.js
import { pgTable, text, boolean, timestamp, decimal, uuid } from "drizzle-orm/pg-core";

export const pitches = pgTable("pitches", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});