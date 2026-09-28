// src/app/profile/page.jsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getMyBookings } from "@/app/actions/booking";
import ProfileClient from "./ProfileClient";

export const metadata = {
    title: "My Profile — TurfZone",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        redirect("/login?callbackUrl=/profile");
    }

    const bookings = await getMyBookings();

    return (
        <ProfileClient
            user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                createdAt: session.user.createdAt
                    ? String(session.user.createdAt)
                    : null,
            }}
            bookings={bookings}
        />
    );
}