// src/app/bookings/loading.jsx
export default function BookingsLoading() {
    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-ink-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-turf-300/25 blur-3xl" />

            <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8 space-y-3">
                    <div className="h-7 w-32 animate-pulse rounded-full bg-ink-200/70" />
                    <div className="h-9 w-2/3 animate-pulse rounded-xl bg-ink-200/70" />
                    <div className="h-4 w-40 animate-pulse rounded-lg bg-ink-200/50" />
                </div>

                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-24 animate-pulse rounded-3xl border border-ink-200 bg-white"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}