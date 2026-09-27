// scratch-test-slots.js
import "dotenv/config";
import { db } from "./src/db/index.js";
import { pitches } from "./src/db/pitch-schema.js";
import { getSlotsForDay, toDateKey } from "./src/lib/slots.js";

const [pitch] = await db.select().from(pitches).limit(1);
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

console.log("Pitch:", pitch.name);
console.log("Date:", toDateKey(tomorrow));
const slots = await getSlotsForDay(pitch.id, toDateKey(tomorrow));
console.log("Slot count:", slots.length);
console.log("All bookable?", slots.every((s) => s.isBookable));
console.log("First 2:", slots.slice(0, 2));

process.exit(0);