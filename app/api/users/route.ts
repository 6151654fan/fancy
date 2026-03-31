import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    // 从 SQLite 数据库中读取所有用户
    const users = db
      .prepare(
        `
      SELECT id, username, password, role 
      FROM users 
      ORDER BY id ASC
    `,
      )
      .all();

    // 转换用户数据格式
    const formattedUsers = users.map((user: any) => ({
      id: user.id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "系统",
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取用户列表失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "用户名和密码不能为空" },
        { status: 400 },
      );
    }

    // 检查用户名是否已存在
    const existingUser = db
      .prepare(
        `
      SELECT id FROM users WHERE username = ?
    `,
      )
      .get(username);

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "用户名已存在" },
        { status: 400 },
      );
    }

    // 从请求头中获取token并解析出当前登录用户
    let createdBy = "系统";
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token));
        createdBy = decoded.username || "系统";
      } catch (error) {
        console.error("解析token失败:", error);
      }
    }

    // 插入新用户到数据库
    const result = db
      .prepare(
        `
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `,
      )
      .run(username, password, role || "user");

    // 获取新创建的用户
    const newUser = db
      .prepare(
        `
      SELECT id, username, password, role 
      FROM users 
      WHERE id = ?
    `,
      )
      .get(result.lastInsertRowid);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id.toString(),
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "系统",
      },
    });
  } catch (error) {
    console.error("添加用户失败:", error);
    return NextResponse.json(
      { success: false, error: "添加用户失败" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "用户ID不能为空" },
        { status: 400 },
      );
    }

    // 不允许删除admin用户
    if (userId === "1") {
      return NextResponse.json(
        { success: false, error: "不能删除管理员账户" },
        { status: 400 },
      );
    }

    // 检查用户是否存在
    const existingUser = db
      .prepare(
        `
      SELECT id FROM users WHERE id = ?
    `,
      )
      .get(userId);

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 },
      );
    }

    // 删除用户
    db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);

    return NextResponse.json({
      success: true,
      message: "用户删除成功",
    });
  } catch (error) {
    console.error("删除用户失败:", error);
    return NextResponse.json(
      { success: false, error: "删除用户失败" },
      { status: 500 },
    );
  }
}
