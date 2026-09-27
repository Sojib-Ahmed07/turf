// src/db/seed.js
import "dotenv/config";
import { db } from "./index.js";
import { pitches } from "./pitch-schema.js";

const PITCHES = [
    {
        name: "Pitch A — 5v5",
        description: "Indoor turf, ideal for 5-a-side games",
        hourlyRate: "800.00",
    },
    {
        name: "Pitch B — 7v7",
        description: "Outdoor turf, floodlights available",
        hourlyRate: "1200.00",
    },
];

async function main() {
    console.log("Seeding pitches…");
    await db.insert(pitches).values(PITCHES);
    console.log(`✅ Inserted ${PITCHES.length} pitches`);
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});