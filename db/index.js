// db/index.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { info, error } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'dedsa.db');

// Database connection singleton
let db = null;

/**
 * Initialize the database
 * @returns {Promise<import('sqlite').Database>}
 */
export async function initDb() {
  if (db) return db;
  
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        discord_id TEXT PRIMARY KEY,
        email TEXT,
        is_member BOOLEAN,
        verification_date TEXT,
        last_active TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (discord_id) REFERENCES users(discord_id)
      );
      
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        details TEXT,
        guild_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_audit_discord_id ON audit_log(discord_id);
      CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
      CREATE INDEX IF NOT EXISTS idx_sessions_discord_id ON sessions(discord_id);
    `);
    
    info(null, 'Database initialized successfully');
    return db;
  } catch (err) {
    error(null, `Database initialization failed: ${err.message}`, { stack: err.stack });
    throw err;
  }
}

/**
 * Get the database connection
 * @returns {import('sqlite').Database}
 */
export async function getDb() {
  if (!db) {
    await initDb();
  }
  return db;
}

/**
 * Close the database connection
 */
export async function closeDb() {
  if (db) {
    await db.close();
    db = null;
    info(null, 'Database connection closed');
  }
}

// Auto-initialize on module load
initDb().catch(err => {
  console.error('Failed to initialize database:', err);
});