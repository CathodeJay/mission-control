import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "mission-control.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT,
      color TEXT NOT NULL DEFAULT '#6366f1',
      avatar_seed TEXT,
      avatar_style TEXT DEFAULT 'bottts',
      status TEXT NOT NULL DEFAULT 'idle',
      current_task TEXT,
      session_id TEXT,
      last_seen INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      target_date INTEGER,
      color TEXT DEFAULT '#6366f1',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      progress INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'not_started',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS kanban_cards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      column TEXT NOT NULL DEFAULT 'backlog',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_agent_id TEXT REFERENCES agents(id),
      project_id TEXT REFERENCES projects(id),
      goal_id TEXT REFERENCES goals(id),
      approval_request_id TEXT,
      approval_command TEXT,
      approval_note TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS activity_feed (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      agent_id TEXT,
      agent_name TEXT,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS metrics_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_at INTEGER NOT NULL DEFAULT (unixepoch()),
      active_sessions INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      total_tool_calls INTEGER DEFAULT 0,
      approvals_pending INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0
    );

    -- Seed default agents if empty
    INSERT OR IGNORE INTO agents (id, name, role, bio, color, avatar_seed, avatar_style) VALUES
      ('jupiter', 'Jupiter', 'COO', 'Chief Operating Officer. Translates vision into operations.', '#8b5cf6', 'jupiter-coo', 'bottts'),
      ('mercury', 'Mercury', 'Full Stack Dev', 'Builder. Ships code, builds systems, makes things real.', '#06b6d4', 'mercury-dev', 'bottts');

    -- Seed sample projects if empty  
    INSERT OR IGNORE INTO projects (id, name, description, status, color) VALUES
      ('rivls', 'RIVLS', 'Print-on-demand brand. Apparel + accessories.', 'active', '#f59e0b'),
      ('ambient-yt', 'Ambient YouTube', 'Passive income via ambient video content.', 'active', '#10b981'),
      ('ai-consulting', 'AI Consulting', 'B2B AI consulting and automation services.', 'concept', '#6366f1');
  `);
}

export default getDb;
