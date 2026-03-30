import { NextRequest, NextResponse } from "next/server";
import { LoginRequest, LoginResponse } from "../../types/auth";
import db from "../../lib/db";

// 生成简单的token（实际项目中应该使用JWT）
function generateToken(user: any): string {
  return btoa(
    JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      timestamp: Date.now(),
    }),
  );
}

// 登录功能
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    // 从SQLite数据库中查找用户
    const user = db
      .prepare(
        `
      SELECT id, username, role, password 
      FROM users 
      WHERE username = ?
    `,
      )
      .get(username);

    if (!user) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "用户名或密码错误" },
        { status: 401 },
      );
    }

    // 验证密码（实际项目中应该使用密码哈希验证）
    if (user.password !== password) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "用户名或密码错误" },
        { status: 401 },
      );
    }

    // 生成token
    const token = generateToken(user);

    return NextResponse.json<LoginResponse>({
      success: true,
      token,
      user: {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    return NextResponse.json<LoginResponse>(
      { success: false, error: "网络错误，请稍后重试" },
      { status: 500 },
    );
  }
}