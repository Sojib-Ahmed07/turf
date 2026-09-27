// src/db/booking-schema.js
import {
    pgTable,
    text,
    timestamp,
    decimal,
    uuid,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema.js";
import { pitches } from "./pitch-schema.js";

export const bookings = pgTable(
    "bookings",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        pitchId: uuid("pitch_id")
            .notNull()
            .references(() => pitches.id, { onDelete: "cascade" }),
        bookingDate: text("booking_date").notNull(),
        startTime: text("start_time").notNull(),
        endTime: text("end_time").notNull(),
        totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
        status: text("status").notNull().default("confirmed"),
        // NEW
        paymentMethod: text("payment_method").notNull().default("cash"),
        paymentStatus: text("payment_status").notNull().default("unpaid"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        uniqueConfirmedSlot: uniqueIndex("unique_confirmed_slot")
            .on(table.pitchId, table.bookingDate, table.startTime)
            .where(sql`${table.status} = 'confirmed'`),
        pitchDateIdx: index("pitch_date_idx").on(table.pitchId, table.bookingDate),
        userIdx: index("user_booking_idx").on(table.userId),
    })
);