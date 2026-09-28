// src/app/bookings/page.jsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getMyBookings } from "@/app/actions/booking";
import MyBookingsClient from "./MyBookingsClient";

export const metadata = {
    title: "My Bookings — TurfZone",
};

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        redirect("/login?callbackUrl=/bookings");
    }

    const bookings = await getMyBookings();

    return (
        <MyBookingsClient
            initialBookings={bookings}
            user={{
                name: session.user.name,
                email: session.user.email,
            }}
        />
    );
}