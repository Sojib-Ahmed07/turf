// src/app/payment/failure/page.jsx
import Link from "next/link";
import { XCircle, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PaymentFailurePage({ searchParams }) {
    const params = await searchParams;
    const bookingId = params?.bookingId;
    const reason = params?.reason;

    // Free up the slot if a booking exists
    if (bookingId) {
        try {
            await db
                .update(bookings)
                .set({ status: "cancelled" })
                .where(eq(bookings.id, bookingId));
        } catch (err) {
            console.error("Failed to cancel booking on failure page:", err);
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-ink-50 px-4">
            <div className="w-full max-w-md rounded-3xl border border-ink-200 bg-white p-8 text-center shadow-xl shadow-ink-900/5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-7 w-7 text-red-600" />
                </div>
                <h1 className="mt-5 text-xl font-extrabold text-ink-900">
                    Payment not completed
                </h1>
                <p className="mt-2 text-sm text-ink-500">
                    {reason
                        ? `Reason: ${reason}`
                        : "The payment was cancelled or failed. Your slot has been released."}
                </p>

                <div className="mt-6 flex flex-col gap-2">
                    <Link
                        href="/book"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500"
                    >
                        Try again
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-2xl border border-ink-200 bg-white px-5 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50"
                    >
                        Back home
                    </Link>
                </div>
            </div>
        </div>
    );
}