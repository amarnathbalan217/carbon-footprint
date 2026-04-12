import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database;

export const initDb = async () => {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Optimize SQLite for performance (especially for OneDrive/Synchronized folders)
  await db.exec('PRAGMA journal_mode = WAL');
  await db.exec('PRAGMA synchronous = NORMAL');
  await db.exec('PRAGMA cache_size = -2000');
  await db.exec('PRAGMA temp_store = MEMORY');


  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      location TEXT,
      household_size TEXT,
      primary_vehicle TEXT,
      home_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Simple migration to add columns if they don't exist (for existing databases)
  try { await db.exec('ALTER TABLE users ADD COLUMN location TEXT'); } catch { }
  try { await db.exec('ALTER TABLE users ADD COLUMN household_size TEXT'); } catch { }
  try { await db.exec('ALTER TABLE users ADD COLUMN primary_vehicle TEXT'); } catch { }
  try { await db.exec('ALTER TABLE users ADD COLUMN home_type TEXT'); } catch { }

  await db.exec(`

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      category TEXT,
      subcategory TEXT,
      value REAL,
      emissions REAL,
      date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS travel_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      start_lat REAL,
      start_lng REAL,
      end_lat REAL,
      end_lng REAL,
      distance REAL,
      transport_mode TEXT,
      emissions REAL,
      timestamp TEXT,
      duration REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
     
    CREATE TABLE IF NOT EXISTS goals (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id INTEGER,
       title TEXT,
       target REAL,
       current REAL,
       deadline TEXT,
       category TEXT,
       created_at TEXT DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_travel_segments_user ON travel_segments(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);


    CREATE TABLE IF NOT EXISTS emission_factors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      subcategory TEXT,
      factor REAL,
      unit TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Recommendations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    impact TEXT,
    difficulty TEXT,
    category TEXT,
    color TEXT,
    bg TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  `);

  // Migration for user_id
  try {
    await db.exec('ALTER TABLE recommendations ADD COLUMN user_id INTEGER');
    console.log('Added user_id column to recommendations');
  } catch (err: any) {
    if (err.message.includes('duplicate column name')) {
      // Column already exists, ignore
    } else {
      console.error('Migration error (user_id):', err.message);
    }
  }

  // Seed default emission factors if table is empty
  const factorsCount = await db.get('SELECT COUNT(*) as count FROM emission_factors');
  if (factorsCount.count === 0) {
    await db.exec(`
      INSERT INTO emission_factors(category, subcategory, factor, unit) VALUES
    ('transport', 'petrol', 0.000261, 'tons/km'),
    ('transport', 'diesel', 0.000236, 'tons/km'),
    ('transport', 'electric', 0.0000621, 'tons/km'),
    ('transport', 'hybrid', 0.000155, 'tons/km'),
    ('transport', 'bus', 0.0000621, 'tons/km'),
    ('transport', 'motorbike', 0.0000932, 'tons/km'),
    ('energy', 'electricity', 0.0004, 'tons/kWh'),
    ('lpg', 'lpg', 0.003, 'tons/kg'),
    ('food', 'beef', 0.0270, 'tons/kg'),
    ('food', 'lamb', 0.0245, 'tons/kg'),
    ('food', 'pork', 0.0121, 'tons/kg'),
    ('food', 'chicken', 0.0069, 'tons/kg'),
    ('food', 'fish', 0.0060, 'tons/kg'),
    ('food', 'shrimp', 0.0120, 'tons/kg'),
    ('food', 'eggs', 0.0045, 'tons/kg'),
    ('food', 'cheese', 0.0135, 'tons/kg'),
    ('food', 'milk', 0.0033, 'tons/kg'),
    ('food', 'butter', 0.0120, 'tons/kg'),
    ('food', 'yogurt', 0.0038, 'tons/kg'),
    ('food', 'rice', 0.0040, 'tons/kg'),
    ('food', 'bread', 0.0015, 'tons/kg'),
    ('food', 'pasta', 0.0019, 'tons/kg'),
    ('food', 'lentils', 0.0009, 'tons/kg'),
    ('food', 'tofu', 0.0020, 'tons/kg'),
    ('food', 'nuts', 0.0023, 'tons/kg'),
    ('food', 'fruits', 0.0010, 'tons/kg'),
    ('food', 'vegetables', 0.0020, 'tons/kg'),
    ('food', 'chocolate', 0.0190, 'tons/kg'),
    ('food', 'coffee', 0.0170, 'tons/kg'),
    ('food', 'tea', 0.0034, 'tons/kg'),
    ('food', 'juice', 0.0020, 'tons/kg'),
    ('food', 'ice_cream', 0.0085, 'tons/kg'),
    ('food', 'pizza', 0.0078, 'tons/kg'),
    ('food', 'burger', 0.0140, 'tons/kg');
    `);
  }

  // Migration: add new food factors to existing databases
  const newFoodFactors: Array<{sub: string; factor: number}> = [
    { sub: 'lamb', factor: 0.0245 }, { sub: 'pork', factor: 0.0121 },
    { sub: 'shrimp', factor: 0.0120 }, { sub: 'eggs', factor: 0.0045 },
    { sub: 'cheese', factor: 0.0135 }, { sub: 'milk', factor: 0.0033 },
    { sub: 'butter', factor: 0.0120 }, { sub: 'yogurt', factor: 0.0038 },
    { sub: 'rice', factor: 0.0040 }, { sub: 'bread', factor: 0.0015 },
    { sub: 'pasta', factor: 0.0019 }, { sub: 'lentils', factor: 0.0009 },
    { sub: 'tofu', factor: 0.0020 }, { sub: 'nuts', factor: 0.0023 },
    { sub: 'fruits', factor: 0.0010 }, { sub: 'vegetables', factor: 0.0020 },
    { sub: 'chocolate', factor: 0.0190 }, { sub: 'coffee', factor: 0.0170 },
    { sub: 'tea', factor: 0.0034 }, { sub: 'juice', factor: 0.0020 },
    { sub: 'ice_cream', factor: 0.0085 }, { sub: 'pizza', factor: 0.0078 },
    { sub: 'burger', factor: 0.0140 },
  ];
  for (const f of newFoodFactors) {
    const exists = await db.get(
      'SELECT id FROM emission_factors WHERE category = ? AND subcategory = ?',
      ['food', f.sub]
    );
    if (!exists) {
      await db.run(
        'INSERT INTO emission_factors(category, subcategory, factor, unit) VALUES (?, ?, ?, ?)',
        ['food', f.sub, f.factor, 'tons/kg']
      );
    }
  }

  // Migration: update old per-meal food factors to per-kg
  const oldMealFactors = [
    { sub: 'beef', factor: 0.0270 },
    { sub: 'chicken', factor: 0.0069 },
    { sub: 'fish', factor: 0.0060 },
  ];
  for (const f of oldMealFactors) {
    await db.run(
      'UPDATE emission_factors SET factor = ?, unit = ? WHERE category = ? AND subcategory = ? AND unit = ?',
      [f.factor, 'tons/kg', 'food', f.sub, 'tons/meal']
    );
  }

  // Seed default recommendations if table is empty
  const recsCount = await db.get('SELECT COUNT(*) as count FROM recommendations');
  if (recsCount.count === 0) {
    await db.exec(`
      INSERT INTO recommendations(title, description, impact, difficulty, category, color, bg) VALUES
    ('Switch to Public Transport', 'Using public transport can reduce emissions.', '0.4 tons', 'Easy', 'Transport', 'text-blue-600', 'bg-blue-100'),
    ('Eat Plant-Based', 'Try going meatless for a day.', '0.2 tons', 'Medium', 'Food', 'text-green-600', 'bg-green-100'),
    ('Use LED Bulbs', 'Switching to LED lighting reduces energy consumption.', '0.1 tons', 'Easy', 'Energy', 'text-yellow-600', 'bg-yellow-100')
      `);
  }

  console.log('Database initialized');
  return db;
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};
