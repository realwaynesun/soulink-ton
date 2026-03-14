import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { config } from './config.js'

export const db: DatabaseType = new Database(config.dbPath, { fileMustExist: false })

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS name_cache (
    name        TEXT PRIMARY KEY,
    owner       TEXT NOT NULL,
    soul_hash   TEXT NOT NULL,
    payment_address TEXT NOT NULL,
    registered_at INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL DEFAULT 0,
    cached_at   INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS profiles (
    agent_name   TEXT PRIMARY KEY,
    display_name TEXT,
    tagline      TEXT,
    avatar_url   TEXT,
    tags         TEXT DEFAULT '[]',
    languages    TEXT DEFAULT '[]',
    links        TEXT DEFAULT '{}',
    updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS credit_reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter    TEXT NOT NULL,
    target      TEXT NOT NULL,
    score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    reason      TEXT,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(reporter, target)
  );

  CREATE TABLE IF NOT EXISTS credit_scores (
    agent_name  TEXT PRIMARY KEY,
    score       INTEGER NOT NULL DEFAULT 50,
    report_count INTEGER NOT NULL DEFAULT 0,
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS registration_jobs (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    owner       TEXT NOT NULL,
    soul_hash   TEXT NOT NULL,
    payment_address TEXT NOT NULL,
    payment_tx  TEXT,
    status      TEXT NOT NULL DEFAULT 'queued',
    tx_hash     TEXT,
    error       TEXT,
    registered_at INTEGER,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS used_payments (
    tx_lt       TEXT PRIMARY KEY,
    tx_hash     TEXT NOT NULL,
    sender      TEXT NOT NULL,
    agent_name  TEXT NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS ghost_candidates (
    name        TEXT PRIMARY KEY,
    item_index  INTEGER NOT NULL,
    detected_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`)

// Migration: add registered_at column to registration_jobs if missing
migrateJobsRegisteredAt()
// Migration: make expires_at have a DEFAULT so INSERTs without it succeed
migrateNameCacheExpiresDefault()
// Migration: add UNIQUE(reporter, target) to credit_reports if missing
migrateCreditReportsUnique()

function migrateJobsRegisteredAt() {
  const cols = db.prepare("PRAGMA table_info(registration_jobs)").all() as { name: string }[]
  if (cols.some(c => c.name === 'registered_at')) return
  db.exec('ALTER TABLE registration_jobs ADD COLUMN registered_at INTEGER')
}

function migrateNameCacheExpiresDefault() {
  // Check if expires_at already has a default (new DBs get it from CREATE TABLE)
  const cols = db.prepare("PRAGMA table_info(name_cache)").all() as { name: string; dflt_value: string | null }[]
  const expiresCol = cols.find(c => c.name === 'expires_at')
  if (!expiresCol || expiresCol.dflt_value !== null) return

  // Rebuild table with DEFAULT 0 on expires_at
  db.exec(`
    CREATE TABLE name_cache_new (
      name        TEXT PRIMARY KEY,
      owner       TEXT NOT NULL,
      soul_hash   TEXT NOT NULL,
      payment_address TEXT NOT NULL,
      registered_at INTEGER NOT NULL,
      expires_at  INTEGER NOT NULL DEFAULT 0,
      cached_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );
    INSERT INTO name_cache_new SELECT * FROM name_cache;
    DROP TABLE name_cache;
    ALTER TABLE name_cache_new RENAME TO name_cache;
  `)
}

function migrateCreditReportsUnique() {
  const indices = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='credit_reports'",
  ).all() as { name: string }[]

  const hasUnique = indices.some(i =>
    i.name.includes('reporter') || i.name === 'sqlite_autoindex_credit_reports_1',
  )
  if (hasUnique) return

  // Check if the auto-generated unique index exists (created by UNIQUE constraint in CREATE TABLE)
  // If table was created without UNIQUE, we need to rebuild it
  try {
    db.exec('CREATE UNIQUE INDEX _test_cr_unique ON credit_reports(reporter, target)')
    // If this succeeds, no duplicates exist — drop the test index, we'll rebuild the table properly
    db.exec('DROP INDEX _test_cr_unique')
  } catch {
    // Duplicates exist — deduplicate first, keeping the latest report per (reporter, target)
    db.exec(`
      DELETE FROM credit_reports WHERE id NOT IN (
        SELECT MAX(id) FROM credit_reports GROUP BY reporter, target
      )
    `)
  }

  // Rebuild table with the UNIQUE constraint
  db.exec(`
    CREATE TABLE credit_reports_new (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter    TEXT NOT NULL,
      target      TEXT NOT NULL,
      score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
      reason      TEXT,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(reporter, target)
    );
    INSERT INTO credit_reports_new (id, reporter, target, score, reason, created_at)
      SELECT id, reporter, target, score, reason, created_at FROM credit_reports;
    DROP TABLE credit_reports;
    ALTER TABLE credit_reports_new RENAME TO credit_reports;
  `)

  // Recalculate credit_scores from deduplicated reports
  db.exec(`
    DELETE FROM credit_scores;
    INSERT INTO credit_scores (agent_name, score, report_count, updated_at)
      SELECT target, CAST(ROUND(AVG(score)) AS INTEGER), COUNT(DISTINCT reporter), unixepoch()
      FROM credit_reports GROUP BY target;
  `)
}
