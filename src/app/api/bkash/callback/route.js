// src/app/api/bkash/callback/route.js
import { NextResponse } from "next/server";
import { finalizeBkashPayment } from "@/app/actions/bkash-payment";

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const paymentID = searchParams.get("paymentID");
    const status = searchParams.get("status");

    if (!bookingId || !paymentID) {
        return NextResponse.redirect(`${origin}/payment/failure?reason=missing-params`);
    }

    // Let bKash's execute API decide the truth — not the URL status param
    try {
        const result = await finalizeBkashPayment({ bookingId, paymentID });

        if (result.ok) {
            return NextResponse.redirect(
                `${origin}/payment/success?trxID=${result.trxID ?? ""}`
            );
        }

        return NextResponse.redirect(
            `${origin}/payment/failure?reason=not-completed`
        );
    } catch (err) {
        console.error("bKash callback finalization error:", err);
        return NextResponse.redirect(
            `${origin}/payment/failure?reason=exception`
        );
    }
}