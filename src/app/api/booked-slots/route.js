// src/app/api/booked-slots/route.js
import { NextResponse } from "next/server";
import { getBookedSlots } from "@/app/actions/booking";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const pitchId = searchParams.get("pitchId");
    const date = searchParams.get("date");

    if (!pitchId || !date) {
        return NextResponse.json(
            { error: "pitchId and date are required" },
            { status: 400 }
        );
    }

    try {
        const startTimes = await getBookedSlots(pitchId, date);
        return NextResponse.json({ startTimes });
    } catch (err) {
        console.error("booked-slots route error:", err);
        return NextResponse.json(
            { error: "Failed to load booked slots" },
            { status: 500 }
        );
    }
}