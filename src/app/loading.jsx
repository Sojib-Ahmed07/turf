// src/app/loading.jsx
export default function Loading() {
    return (
        <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-ink-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-turf-300/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-turf-200/30 blur-3xl" />

            <div className="relative flex flex-col items-center gap-4">
                <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-turf-200 border-t-turf-600" />
                <p className="text-sm font-semibold text-ink-500">Loading…</p>
            </div>
        </div>
    );
}