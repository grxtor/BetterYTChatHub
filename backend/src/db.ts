import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import type { ChatMessage } from '../../shared/chat';

const dbPath = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

const db = new Database(path.join(dbPath, 'chat-history.db'));

// Basic initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    liveId TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    data TEXT NOT NULL
  );
  
  CREATE INDEX IF NOT EXISTS idx_messages_liveId ON messages(liveId);
  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
`);

const insertMessageStmt = db.prepare(`
  INSERT OR IGNORE INTO messages (id, liveId, timestamp, data)
  VALUES (@id, @liveId, @timestamp, @data)
`);

const getMessagesStmt = db.prepare(`
  SELECT data FROM messages
  WHERE liveId = ?
  ORDER BY timestamp DESC
  LIMIT ?
`);

export function saveMessage(liveId: string, message: ChatMessage) {
  try {
    const timestamp = message.publishedAt ? new Date(message.publishedAt).getTime() : Date.now();
    insertMessageStmt.run({
      id: message.id,
      liveId,
      timestamp,
      data: JSON.stringify(message)
    });
  } catch (err) {
    console.error('[DB] Failed to save message', err);
  }
}

export function getRecentMessages(liveId: string, limit = 500): ChatMessage[] {
  try {
    const rows = getMessagesStmt.all(liveId, limit) as { data: string }[];
    // Reverse them to put chronological order back
    return rows.reverse().map(row => JSON.parse(row.data) as ChatMessage);
  } catch (err) {
    console.error('[DB] Failed to get messages', err);
    return [];
  }
}
