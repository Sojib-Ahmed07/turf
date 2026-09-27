// src/app/book/page.jsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPitches } from "@/app/actions/booking";
import BookingClient from "./BookingClient";

export const metadata = {
    title: "Book a Turf — TurfZone",
    description: "Pick your pitch, date, and time slot.",
};

export default async function BookPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/login?callbackUrl=/book");
    }

    const pitches = await getPitches();

    return (
        <BookingClient
            pitches={pitches}
            user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
            }}
        />
    );
}