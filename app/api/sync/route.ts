import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId 参数" }, { status: 400 });
    }

    // 查询用户的所有会话
    const sessions = db
      .prepare(
        `
      SELECT id, sessionId, title, createdAt 
      FROM sessions 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `,
      )
      .all(userId);

    // 为每个会话查询消息
    const sessionsWithMessages = await Promise.all(
      sessions.map(async (session: any) => {
        const messages = db
          .prepare(
            `
        SELECT messageId, role, content, date 
        FROM messages 
        WHERE sessionId = ? 
        ORDER BY date ASC
      `,
          )
          .all(session.id);

        return {
          id: session.sessionId,
          topic: session.title,
          createdAt: session.createdAt,
          messages: messages.map((msg: any) => ({
            id: msg.messageId,
            role: msg.role,
            content: msg.content,
            date: msg.date,
          })),
        };
      }),
    );

    return NextResponse.json(sessionsWithMessages);
  } catch (error) {
    console.error("拉取漫游数据失败:", error);
    return NextResponse.json({ error: "拉取漫游数据失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, session, message } = body;

    if (!userId || !session || !message) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 开始事务
    const transaction = db.transaction(() => {
      // 检查会话是否存在
      const existingSession = db
        .prepare(
          `
        SELECT id FROM sessions 
        WHERE userId = ? AND sessionId = ?
      `,
        )
        .get(userId, session.id);

      let sessionId;
      if (existingSession) {
        // 会话已存在
        sessionId = existingSession.id;
      } else {
        // 会话不存在，插入新会话
        // 优先使用title，其次topic，最后使用兜底字符串
        const finalTitle = session.title || session.topic || "新的聊天";
        const result = db
          .prepare(
            `
          INSERT INTO sessions (userId, sessionId, title, createdAt) 
          VALUES (?, ?, ?, ?)
        `,
          )
          .run(
            userId,
            session.id,
            finalTitle,
            session.createdAt || new Date().toISOString(),
          );
        sessionId = result.lastInsertRowid;
      }

      // 插入消息
      db.prepare(
        `
        INSERT OR REPLACE INTO messages (sessionId, messageId, role, content, date) 
        VALUES (?, ?, ?, ?, ?)
      `,
      ).run(
        sessionId,
        message.id,
        message.role,
        JSON.stringify(message.content),
        message.date,
      );
    });

    // 执行事务
    transaction();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("上传数据失败:", error);
    return NextResponse.json({ error: "上传数据失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 开始事务
    const transaction = db.transaction(() => {
      // 首先获取会话的数据库ID
      const session = db
        .prepare(
          `
        SELECT id FROM sessions 
        WHERE userId = ? AND sessionId = ?
      `,
        )
        .get(userId, sessionId);

      if (session) {
        // 删除会话相关的所有消息
        db.prepare(`DELETE FROM messages WHERE sessionId = ?`).run(session.id);
        // 删除会话本身
        db.prepare(`DELETE FROM sessions WHERE id = ? AND userId = ?`).run(
          session.id,
          userId,
        );
      }
    });

    // 执行事务
    transaction();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除会话失败:", error);
    return NextResponse.json({ error: "删除会话失败" }, { status: 500 });
  }
}
