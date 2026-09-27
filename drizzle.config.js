import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load variables from .env.local (or fallback to .env)
config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
    schema: './src/db/schema.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});