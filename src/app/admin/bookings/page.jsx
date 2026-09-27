// src/app/admin/bookings/page.jsx
import { getAllBookings, getAllPitchesAdmin } from "@/app/actions/admin";
import BookingsTable from "../_components/BookingsTable";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
    const [bookings, pitches] = await Promise.all([
        getAllBookings(),
        getAllPitchesAdmin(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                    Bookings
                </h1>
                <p className="mt-1 text-sm text-ink-500">
                    {bookings.length} booking{bookings.length === 1 ? "" : "s"} total
                </p>
            </div>

            <BookingsTable initialBookings={bookings} pitches={pitches} />
        </div>
    );
}