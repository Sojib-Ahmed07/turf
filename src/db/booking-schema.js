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
        // "pending" (awaiting bkash) | "confirmed" (paid) | "cancelled"
        status: text("status").notNull().default("pending"),
        // Always "bkash" now — kept for future extensibility
        paymentMethod: text("payment_method").notNull().default("bkash"),
        // "pending" | "paid"
        paymentStatus: text("payment_status").notNull().default("pending"),
        bkashPaymentID: text("bkash_payment_id"),
        bkashTrxID: text("bkash_trx_id"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        uniqueActiveSlot: uniqueIndex("unique_active_slot")
            .on(table.pitchId, table.bookingDate, table.startTime)
            .where(sql`${table.status} <> 'cancelled'`),
        pitchDateIdx: index("pitch_date_idx").on(table.pitchId, table.bookingDate),
        userIdx: index("user_booking_idx").on(table.userId),
    })
);