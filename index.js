require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const swaggerDocs = require('./utils/swagger');

const app = express();
app.use(express.json());
app.use(cors());

// Logging API requests
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  logger.info('Test route accessed');
  res.send('✅ Verista Backend is Running!');
});

// 🔹 Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 🔹 PostgreSQL Connection
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
db.connect()
  .then(() => logger.info('✅ PostgreSQL Connected'))
  .catch(err => logger.error(`❌ Database Connection Error: ${err.message}`));

// Integrate Swagger
swaggerDocs(app);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.originalUrl}`);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Export app (for testing)
module.exports = app;

// Start server if not in test environment
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
}