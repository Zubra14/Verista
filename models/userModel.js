const { Pool } = require('pg');  // PostgreSQL client
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL, // Database URL from .env
});

// 🔹 Create a new user (Signup)
async function createUser(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10); // Hash password
  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
    [email, hashedPassword]
  );
  return result.rows[0]; // Return created user
}

// 🔹 Find user by email (Login)
async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0]; // Return found user
}

module.exports = { createUser, findUserByEmail };
