import { NextRequest, NextResponse } from "next/server";
import db, { getUserDb } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, topic, userId } = body;

    if (!sessionId || !topic || !userId) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 },
      );
    }

    // 获取用户信息，获取用户名
    const user = db
      .prepare(`SELECT username FROM users WHERE id = ?`)
      .get(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 },
      );
    }

    const userDb = getUserDb(user.username);

    // 更新会话标题
    const result = userDb
      .prepare(
        `
      UPDATE sessions 
      SET title = ? 
      WHERE sessionId = ?
    `,
      )
      .run(topic, sessionId);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: "会话不存在" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新标题失败:", error);
    return NextResponse.json(
      { success: false, error: "更新标题失败" },
      { status: 500 },
    );
  }
}
