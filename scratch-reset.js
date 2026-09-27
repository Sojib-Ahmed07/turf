// scratch-inspect.js
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const cols = await sql`
  select column_name, data_type, column_default, is_nullable
  from information_schema.columns
  where table_name = 'pitches'
  order by ordinal_position
`;
console.log("pitches columns:");
console.table(cols);

const bcols = await sql`
  select column_name, data_type, column_default, is_nullable
  from information_schema.columns
  where table_name = 'bookings'
  order by ordinal_position
`;
console.log("bookings columns:");
console.table(bcols);

process.exit(0);