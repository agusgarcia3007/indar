import { Database } from "bun:sqlite";

export const db = new Database("indar.sqlite", { create: true });

// Enable WAL mode for better concurrent performance
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

export function initializeDatabase() {
  // Better Auth core tables (normally created by CLI migrate, done manually for bun:sqlite compatibility)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      accessTokenExpiresAt TEXT,
      refreshTokenExpiresAt TEXT,
      scope TEXT,
      idToken TEXT,
      password TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Application tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS project (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_key (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT 'Default',
      lastUsedAt TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (projectId) REFERENCES project(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS channel (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('email', 'telegram')),
      name TEXT NOT NULL,
      config TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      apiKeyId TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT NULL,
      metadata TEXT DEFAULT '{}',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (projectId) REFERENCES project(id) ON DELETE CASCADE,
      FOREIGN KEY (apiKeyId) REFERENCES api_key(id)
    );

    CREATE TABLE IF NOT EXISTS notification (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      channelId TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
      error TEXT DEFAULT NULL,
      sentAt TEXT DEFAULT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (eventId) REFERENCES event(id) ON DELETE CASCADE,
      FOREIGN KEY (channelId) REFERENCES channel(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_channel_rule (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      channelId TEXT NOT NULL,
      eventCategory TEXT NOT NULL DEFAULT '*',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (projectId) REFERENCES project(id) ON DELETE CASCADE,
      FOREIGN KEY (channelId) REFERENCES channel(id) ON DELETE CASCADE,
      UNIQUE(projectId, channelId, eventCategory)
    );

    CREATE INDEX IF NOT EXISTS idx_project_userId ON project(userId);
    CREATE INDEX IF NOT EXISTS idx_api_key_projectId ON api_key(projectId);
    CREATE INDEX IF NOT EXISTS idx_api_key_key ON api_key(key);
    CREATE INDEX IF NOT EXISTS idx_channel_userId ON channel(userId);
    CREATE INDEX IF NOT EXISTS idx_event_projectId ON event(projectId);
    CREATE INDEX IF NOT EXISTS idx_event_createdAt ON event(createdAt);
    CREATE INDEX IF NOT EXISTS idx_notification_eventId ON notification(eventId);
    CREATE INDEX IF NOT EXISTS idx_notification_channelId ON notification(channelId);
    CREATE INDEX IF NOT EXISTS idx_project_channel_rule_projectId ON project_channel_rule(projectId);
  `);
}
