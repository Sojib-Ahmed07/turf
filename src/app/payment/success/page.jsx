// src/app/payment/success/page.jsx
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({ searchParams }) {
    const params = await searchParams;
    const trxID = params?.trxID;

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-ink-50 px-4">
            <div className="w-full max-w-md rounded-3xl border border-ink-200 bg-white p-8 text-center shadow-xl shadow-ink-900/5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-turf-100">
                    <CheckCircle2 className="h-7 w-7 text-turf-600" />
                </div>
                <h1 className="mt-5 text-xl font-extrabold text-ink-900">
                    Payment confirmed!
                </h1>
                <p className="mt-2 text-sm text-ink-500">
                    Your slot is locked in. See you on the pitch.
                </p>

                {trxID && (
                    <div className="mt-5 rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-xs">
                        <span className="text-ink-500">Transaction ID: </span>
                        <span className="font-mono font-bold text-ink-900">{trxID}</span>
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-2">
                    <Link
                        href="/book"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-turf-500 to-turf-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-turf-400 hover:to-turf-500"
                    >
                        Book another slot
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