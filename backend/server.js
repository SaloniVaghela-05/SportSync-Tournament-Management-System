const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import database connection for health check
const { query } = require('./db/db');

// Import routes
const playerRoutes = require('./routes/playerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const functionRoutes = require('./routes/functionRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const personRoutes = require('./routes/personRoutes');

// API routes
app.use('/api/player', playerRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/function', functionRoutes);
app.use('/api/tournament', tournamentRoutes);
app.use('/api/person', personRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sport Tournament API is running' });
});

// Database connection check endpoint
app.get('/api/db-check', async (req, res) => {
  try {
    // Test connection with a simple query
    const result = await query('SELECT NOW() as current_time, version() as pg_version, current_database() as database_name');
    
    res.json({
      status: 'Connected',
      database: result.rows[0].database_name || process.env.DB_NAME || 'sporttournament',
      timestamp: result.rows[0].current_time,
      postgres_version: result.rows[0].pg_version.split(',')[0].trim(),
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
    });
  } catch (error) {
    // Provide detailed error information
    const errorDetails = {
      status: 'Disconnected',
      database: process.env.DB_NAME || 'sporttournament',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      error: error.message,
      code: error.code || 'UNKNOWN',
    };

    // Add helpful error messages based on error code
    if (error.code === 'ECONNREFUSED') {
      errorDetails.suggestion = 'PostgreSQL server is not running or host/port is incorrect';
    } else if (error.code === '28P01') {
      errorDetails.suggestion = 'Invalid username or password. Check your .env file';
    } else if (error.code === '3D000') {
      errorDetails.suggestion = 'Database does not exist. Create it first using: CREATE DATABASE ' + (process.env.DB_NAME || 'sporttournament');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      errorDetails.suggestion = 'Cannot reach database server. Check host and network connection';
    } else {
      errorDetails.suggestion = 'Check your database configuration in .env file';
    }

    res.status(500).json(errorDetails);
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Sport Tournament Database Manager API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// Test database connection on server startup
const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing database connection on startup...');
    const { query } = require('./db/db');
    const result = await query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ Database connection successful!');
    console.log(`   Database: ${result.rows[0].db_name}`);
    console.log(`   Time: ${result.rows[0].current_time}`);
  } catch (error) {
    console.error('❌ Database connection failed on startup!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error('⚠️  Server will start, but database operations may fail.');
    console.error('   Make sure PostgreSQL is running and .env file is configured correctly.');
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  // Test database connection
  await testDatabaseConnection();
});

