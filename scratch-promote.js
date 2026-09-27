// scratch-promote.js
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Change this to your email
const ADMIN_EMAIL = "ahmed.sojib0456@gmail.com";

const result = await sql`
  update "user"
  set role = 'admin'
  where email = ${ADMIN_EMAIL}
  returning id, email, name, role
`;

console.log(result);
process.exit(0);