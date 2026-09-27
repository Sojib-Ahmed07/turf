// scratch-users.js
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
console.log(await sql`select id, email, name, role from "user"`);
process.exit(0);