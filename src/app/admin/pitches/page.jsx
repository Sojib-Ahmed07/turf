// src/app/admin/pitches/page.jsx
import { getAllPitchesAdmin } from "@/app/actions/admin";
import PitchesManager from "../_components/PitchesManager";

export const dynamic = "force-dynamic";

export default async function AdminPitchesPage() {
    const pitches = await getAllPitchesAdmin();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                    Grounds
                </h1>
                <p className="mt-1 text-sm text-ink-500">
                    {pitches.length} ground{pitches.length === 1 ? "" : "s"} ·{" "}
                    {pitches.filter((p) => p.isActive).length} active
                </p>
            </div>

            <PitchesManager initialPitches={pitches} />
        </div>
    );
}