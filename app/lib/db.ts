import SQLite from "better-sqlite3";
import path from "path";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";

// ==========================================
// 1. 统一数据目录配置
// ==========================================
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

// 确保基础数据目录存在
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// 确保 chats 子目录存在
const chatsDir = path.join(DATA_DIR, "chats");
if (!existsSync(chatsDir)) {
  mkdirSync(chatsDir, { recursive: true });
}

// 数据库连接池 - 使用 any 类型彻底绕过 TS 类型检查
const dbPool: Record<string, any> = {};

// ==========================================
// 2. 用户聊天数据库管理 (一户一档)
// ==========================================

// 初始化用户专属数据库表
function initUserDatabase(db: any) {
  // 创建 sessions 表 (时间字段使用 INTEGER 存毫秒时间戳)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // 创建 messages 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL,
      messageId TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      date INTEGER NOT NULL,
      model TEXT,
      FOREIGN KEY (sessionId) REFERENCES sessions (id)
    );
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_sessionId ON messages (sessionId);
    CREATE INDEX IF NOT EXISTS idx_messages_date ON messages (date);
  `);
}

// 获取/创建 用户专属数据库连接
export function getUserDb(username: string): any {
  if (!username) {
    throw new Error("用户名不能为空");
  }

  if (dbPool[username]) {
    return dbPool[username];
  }

  const dbPath = path.join(chatsDir, `${username}.db`);
  // 实例化数据库连接
  const db = new SQLite(dbPath);

  // 启用WAL模式和优化同步设置，提升并发性能
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // 初始化数据库表结构
  initUserDatabase(db);

  // 存入连接池
  dbPool[username] = db;

  return db;
}

// 关闭用户数据库连接
export function closeUserDb(username: string) {
  if (dbPool[username]) {
    dbPool[username].close();
    delete dbPool[username];
  }
}

// 💥 新增：彻底删除用户专属数据库（物理销毁）
export function deleteUserDb(username: string) {
  if (!username) return;

  // 1. 必须先释放连接，否则 Windows/Linux 下会报文件被占用 (EBUSY)
  closeUserDb(username);

  // 2. 清理所有相关物理文件 (SQLite 开启 WAL 模式后会产生三个文件)
  const dbPath = join(chatsDir, `${username}.db`);
  const walPath = join(chatsDir, `${username}.db-wal`);
  const shmPath = join(chatsDir, `${username}.db-shm`);

  if (existsSync(dbPath)) unlinkSync(dbPath);
  if (existsSync(walPath)) unlinkSync(walPath);
  if (existsSync(shmPath)) unlinkSync(shmPath);
}

// ==========================================
// 3. 主数据库管理 (用户账号体系)
// ==========================================
const mainDbPath = path.join(DATA_DIR, "users.db");
// 使用 any 类型彻底绕过 TS 类型检查
const mainDb: any = new SQLite(mainDbPath);

mainDb.pragma("journal_mode = WAL");
mainDb.pragma("synchronous = NORMAL");

// 初始化主数据库表结构
function initMainDatabase() {
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdBy TEXT DEFAULT '系统'
    );
  `);

  try {
    mainDb.exec(`ALTER TABLE users ADD COLUMN createdBy TEXT DEFAULT '系统';`);
  } catch (error) {
    // 字段已存在时忽略错误
  }

  mainDb.exec(`
    INSERT OR IGNORE INTO users (id, username, password, role, createdBy) VALUES
    (1, 'admin', 'admin123', 'admin', '系统'),
    (2, 'user', 'user123', 'user', '系统');
  `);
}

initMainDatabase();

export default mainDb;
