import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

// Function to create a new connection pool
export const createPool = () => {
  if (process.env.DATABASE_URL) {
    console.log('PostgreSQL database pool created using DATABASE_URL (connectionString)...');
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 15000,
      ssl: {
        rejectUnauthorized: false, // Required for secure serverless/hosted databases (Railway, Neon, Supabase)
      },
    });
  }
  
  console.log('PostgreSQL database pool created using individual SQL_* variables...');
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

// Create a pool instance
const pool = createPool();

// Prevent idle pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
export default db;
