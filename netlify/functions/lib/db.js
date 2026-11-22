import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

let pool = null;
let schemaReady = false;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureSchema(pgPool) {
  if (schemaReady) return;
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      reddit_client_id TEXT DEFAULT '',
      reddit_client_secret TEXT DEFAULT '',
      reddit_username TEXT DEFAULT '',
      reddit_password TEXT DEFAULT '',
      reddit_user_agent TEXT DEFAULT '',
      gemini_api_key TEXT DEFAULT '',
      gemini_model TEXT DEFAULT 'gemini-2.5-flash',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  schemaReady = true;
}

// Local JSON fallback when DATABASE_URL is not configured
const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data', 'db.json');

function readLocalDb() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    return { nextId: 1, users: [] };
  }
  return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
}

function writeLocalDb(data) {
  fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
}

export async function findUserByUsername(username) {
  const normalized = username.trim().toLowerCase();
  const pgPool = getPool();
  if (pgPool) {
    await ensureSchema(pgPool);
    const { rows } = await pgPool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [normalized]
    );
    return rows[0] || null;
  }
  const db = readLocalDb();
  return db.users.find((u) => u.username === normalized) || null;
}

export async function findUserById(id) {
  const pgPool = getPool();
  if (pgPool) {
    await ensureSchema(pgPool);
    const { rows } = await pgPool.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }
  const db = readLocalDb();
  return db.users.find((u) => u.id === Number(id)) || null;
}

export async function createUser(username, passwordHash) {
  const normalized = username.trim().toLowerCase();
  const pgPool = getPool();
  if (pgPool) {
    await ensureSchema(pgPool);
    const { rows } = await pgPool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING *`,
      [normalized, passwordHash]
    );
    return rows[0];
  }
  const db = readLocalDb();
  if (db.users.some((u) => u.username === normalized)) {
    const err = new Error('Username already exists');
    err.code = '23505';
    throw err;
  }
  const user = {
    id: db.nextId++,
    username: normalized,
    password_hash: passwordHash,
    reddit_client_id: '',
    reddit_client_secret: '',
    reddit_username: '',
    reddit_password: '',
    reddit_user_agent: '',
    gemini_api_key: '',
    gemini_model: 'gemini-2.5-flash',
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  writeLocalDb(db);
  return user;
}

export async function updateUserSettings(userId, fields) {
  const pgPool = getPool();
  if (pgPool) {
    await ensureSchema(pgPool);
    const { rows } = await pgPool.query(
      `UPDATE users SET
        reddit_client_id = $1,
        reddit_client_secret = $2,
        reddit_username = $3,
        reddit_password = $4,
        reddit_user_agent = $5,
        gemini_api_key = $6,
        gemini_model = $7
       WHERE id = $8
       RETURNING *`,
      [
        fields.reddit_client_id,
        fields.reddit_client_secret,
        fields.reddit_username,
        fields.reddit_password,
        fields.reddit_user_agent,
        fields.gemini_api_key,
        fields.gemini_model,
        userId,
      ]
    );
    return rows[0];
  }
  const db = readLocalDb();
  const idx = db.users.findIndex((u) => u.id === Number(userId));
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...fields };
  writeLocalDb(db);
  return db.users[idx];
}
