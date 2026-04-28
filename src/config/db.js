import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Memuat variabel dari .env 

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Database terhubung dengan sukses.');
});
