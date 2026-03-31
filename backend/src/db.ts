import Database from "better-sqlite3";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export function initDatabase(filename: string = "e164.db"): Database.Database {
  db = new Database(filename);

  const schema = `
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      asn TEXT PRIMARY KEY,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- NS 服务器表
    CREATE TABLE IF NOT EXISTS ns_servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asn TEXT NOT NULL,
      server TEXT NOT NULL,
      FOREIGN KEY(asn) REFERENCES users(asn) ON DELETE CASCADE
    );

    -- 号码簿表
    CREATE TABLE IF NOT EXISTS phonebooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asn TEXT NOT NULL,
      number TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY(asn) REFERENCES users(asn) ON DELETE CASCADE
    );
  `;

  db.exec(schema);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
