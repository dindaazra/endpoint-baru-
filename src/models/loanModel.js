import { pool } from '../config/db.js';

export const LoanModel = {
  async createLoan(book_id, member_id, due_date) {
    const client = await pool.connect(); // Menggunakan client untuk transaksi
    try {
      await client.query('BEGIN'); // Mulai transaksi database

      // 1. Cek ketersediaan buku
      const bookCheck = await client.query('SELECT available_copies FROM books WHERE id = $1', [book_id]);
      if (bookCheck.rows[0].available_copies <= 0) {
        throw new Error('Buku sedang tidak tersedia (stok habis).');
      }

      // 2. Kurangi stok buku
      await client.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);

      // 3. Catat transaksi peminjaman
      const loanQuery = `
        INSERT INTO loans (book_id, member_id, due_date) 
        VALUES ($1, $2, $3) RETURNING *
      `;
      const result = await client.query(loanQuery, [book_id, member_id, due_date]);

      await client.query('COMMIT'); // Simpan semua perubahan
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); // Batalkan jika ada error
      throw error;
    } finally {
      client.release();
    }
  },

  async getAllLoans() {
    const query = `
      SELECT l.*, b.title as book_title, m.full_name as member_name 
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getTopBorrowers(limit = 3) {
    const query = `
      WITH member_stats AS (
        SELECT
          m.*,
          COUNT(l.id) AS total_loans,
          MAX(l.loan_date) AS last_loan_date
        FROM members m
        JOIN loans l ON l.member_id = m.id
        GROUP BY m.id
      ),
      favorite_books AS (
        SELECT
          l.member_id,
          b.title,
          COUNT(*) AS times_borrowed,
          ROW_NUMBER() OVER (
            PARTITION BY l.member_id
            ORDER BY COUNT(*) DESC, MAX(l.loan_date) DESC, b.title ASC
          ) AS rn
        FROM loans l
        JOIN books b ON b.id = l.book_id
        GROUP BY l.member_id, b.title
      )
      SELECT
        ms.id AS member_id,
        ms.full_name,
        ms.email,
        ms.member_type,
        ms.total_loans,
        ms.last_loan_date,
        fb.title AS favorite_book_title,
        fb.times_borrowed
      FROM member_stats ms
      LEFT JOIN favorite_books fb
        ON fb.member_id = ms.id AND fb.rn = 1
      ORDER BY ms.total_loans DESC, ms.last_loan_date DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    return result.rows.map((row) => ({
      member_id: row.member_id,
      full_name: row.full_name,
      email: row.email,
      member_type: row.member_type,
      total_loans: Number(row.total_loans),
      last_loan_date: row.last_loan_date,
      favorite_book: {
        title: row.favorite_book_title,
        times_borrowed: Number(row.times_borrowed || 0)
      }
    }));
  }
};
