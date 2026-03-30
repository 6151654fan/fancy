import Database from "better-sqlite3";
import { join } from "path";

// 数据库文件路径
const dbPath = join(process.cwd(), "local_chat.db");

// 创建数据库连接
const db = new Database(dbPath);

// 启用WAL模式和优化同步设置，提升并发性能
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// 初始化数据库表结构
function initDatabase() {
  // 创建 users 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );
  `);

  // 插入默认用户
  db.exec(`
    INSERT OR IGNORE INTO users (id, username, password, role) VALUES
    (1, 'admin', 'admin123', 'admin'),
    (2, 'user', 'user123', 'user');
  `);

  // 创建 sessions 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      sessionId TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
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
      date TEXT NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES sessions (id)
    );
  `);

  // 创建索引
  db.exec(`
    -- 加速查找某人的所有会话
    CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions (userId);
    -- 加速查找某个会话下的所有消息
    CREATE INDEX IF NOT EXISTS idx_messages_sessionId ON messages (sessionId);
    -- 加速聊天记录的按时间排序
    CREATE INDEX IF NOT EXISTS idx_messages_date ON messages (date);
  `);
}

// 初始化数据库
initDatabase();

export default db;
