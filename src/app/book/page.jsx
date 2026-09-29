// src/app/book/page.jsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPitches } from "@/app/actions/booking";
import BookingClient from "./BookingClient";

export const metadata = {
    title: "Book a Turf — TurfZone",
    description: "Pick your ground, date, and time slot.",
};

export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const params = await searchParams;
    const initialPitchId =
        typeof params?.pitchId === "string" ? params.pitchId : null;

    if (!session?.user) {
        // Preserve the ground the user was trying to book.
        const target = initialPitchId
            ? `/book?pitchId=${encodeURIComponent(initialPitchId)}`
            : "/book";
        redirect(`/login?callbackUrl=${encodeURIComponent(target)}`);
    }

    const pitches = await getPitches();

    return (
        <BookingClient
            pitches={pitches}
            initialPitchId={initialPitchId}
            user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
            }}
        />
    );
}