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
import { timeBlocks } from "./timeblock-schema.js";

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
        // Snapshot of the block the user booked. Nullable for safety but
        // every new booking sets it.
        timeBlockId: uuid("time_block_id").references(() => timeBlocks.id, {
            onDelete: "set null",
        }),
        bookingDate: text("booking_date").notNull(),
        // Snapshots — pricing/time can change on the block later without
        // breaking historical bookings.
        startTime: text("start_time").notNull(),
        endTime: text("end_time").notNull(),
        totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
        status: text("status").notNull().default("pending"),
        paymentMethod: text("payment_method").notNull().default("bkash"),
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