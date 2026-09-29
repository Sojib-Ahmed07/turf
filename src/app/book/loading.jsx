// src/app/book/loading.jsx
export default function BookingLoading() {
    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-ink-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-turf-300/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-turf-200/30 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                {/* Header */}
                <div className="mb-6 space-y-3 sm:mb-8">
                    <div className="h-7 w-32 animate-pulse rounded-full bg-ink-200/70" />
                    <div className="h-9 w-3/4 animate-pulse rounded-xl bg-ink-200/70 sm:w-2/3" />
                    <div className="h-4 w-1/2 animate-pulse rounded-lg bg-ink-200/50" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[320px_1fr]">
                    {/* Left column */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="rounded-3xl border border-ink-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="mb-3 h-4 w-32 animate-pulse rounded bg-ink-200/70" />
                            <div className="space-y-2">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="h-14 w-full animate-pulse rounded-2xl bg-ink-100"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-ink-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="mb-3 h-4 w-28 animate-pulse rounded bg-ink-200/70" />
                            <div className="grid grid-cols-3 gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="h-20 animate-pulse rounded-2xl bg-ink-100"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column — slot grid */}
                    <div className="rounded-3xl border border-ink-200 bg-white p-4 shadow-sm sm:p-7">
                        <div className="mb-5 h-6 w-56 animate-pulse rounded-lg bg-ink-200/70" />
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-2xl bg-ink-100"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}