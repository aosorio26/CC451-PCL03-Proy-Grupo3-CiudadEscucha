import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
export const dataDir = path.resolve(process.env.DATA_DIR || "./data");
mkdirSync(dataDir, { recursive: true });
export const db = new DatabaseSync(path.join(dataDir, "ciudad.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'ciudadano',bio TEXT NOT NULL DEFAULT '',prefs TEXT NOT NULL DEFAULT '{}',created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),title TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,district TEXT NOT NULL,address TEXT NOT NULL,lat REAL NOT NULL,lng REAL NOT NULL,urgency TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Reportado',photo TEXT,photo_alt TEXT NOT NULL DEFAULT '',created TEXT NOT NULL,demo INTEGER NOT NULL DEFAULT 0,assigned TEXT REFERENCES users(id),request_key TEXT,UNIQUE(user_id,request_key));
CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY,report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,user_id TEXT REFERENCES users(id),status TEXT NOT NULL,note TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS supports(user_id TEXT REFERENCES users(id),report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,PRIMARY KEY(user_id,report_id));
CREATE TABLE IF NOT EXISTS follows(user_id TEXT REFERENCES users(id),report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,PRIMARY KEY(user_id,report_id));
CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,body TEXT NOT NULL,created TEXT NOT NULL,hidden INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS flags(user_id TEXT REFERENCES users(id),comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,reason TEXT NOT NULL,PRIMARY KEY(user_id,comment_id));
CREATE TABLE IF NOT EXISTS neighbors(user_id TEXT REFERENCES users(id),target_id TEXT REFERENCES users(id),kind TEXT NOT NULL,status TEXT NOT NULL,PRIMARY KEY(user_id,target_id,kind));
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,body TEXT NOT NULL,read INTEGER NOT NULL DEFAULT 0,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS conversations(id INTEGER PRIMARY KEY,user_id TEXT REFERENCES users(id),role TEXT NOT NULL,content TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS drafts(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),payload TEXT NOT NULL,created TEXT NOT NULL,report_id TEXT REFERENCES reports(id));
CREATE INDEX IF NOT EXISTS reports_filters ON reports(category,district,status);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id,created);
INSERT OR IGNORE INTO migrations VALUES(1);`);
if (!db.prepare("PRAGMA table_info(users)").all().some(c => c.name === "avatar")) {
  db.exec("ALTER TABLE users ADD COLUMN avatar TEXT; INSERT OR IGNORE INTO migrations VALUES(2);");
}
if (!db.prepare("PRAGMA table_info(users)").all().some(c=>c.name==="learning")) db.exec("ALTER TABLE users ADD COLUMN learning TEXT NOT NULL DEFAULT '{}'; INSERT OR IGNORE INTO migrations VALUES(3);");
export const all = (sql, ...args) => db.prepare(sql).all(...args);
export const one = (sql, ...args) => db.prepare(sql).get(...args);
export const run = (sql, ...args) => db.prepare(sql).run(...args);
export function transaction(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
