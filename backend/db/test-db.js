require('dotenv').config();
const { pool, query } = require('./db.js');

console.log('🔍 Testing PostgreSQL connection...');
console.log('📋 Configuration:');
console.log('   Host:', process.env.DB_HOST || 'localhost');
console.log('   Port:', process.env.DB_PORT || 5432);
console.log('   Database:', process.env.DB_NAME || 'sporttournament');
console.log('   User:', process.env.DB_USER || 'postgres');
console.log('   Password:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('');

(async () => {
  try {
    console.log('⏳ Attempting to connect...');
    const res = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('');
    console.log('✅ Connected successfully to PostgreSQL!');
    console.log('🕒 Current database time:', res.rows[0].current_time);
    console.log('📦 PostgreSQL version:', res.rows[0].pg_version.split(',')[0].trim());
    console.log('');
  } catch (err) {
    console.log('');
    console.error('❌ Connection failed!');
    console.error('📛 Error message:', err.message);
    if (err.code) {
      console.error('🔢 Error code:', err.code);
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('💡 Tip: Make sure PostgreSQL is running and the host/port are correct.');
    } else if (err.code === '28P01') {
      console.error('💡 Tip: Check your username and password in the .env file.');
    } else if (err.code === '3D000') {
      console.error('💡 Tip: The database does not exist. Create it first.');
    }
    console.log('');
    process.exit(1);
  } finally {
    console.log('🔌 Closing connection pool...');
    await pool.end();
    console.log('✅ Done!');
  }
})();
