import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 创建一个带超时的fetch请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

    const response = await fetch("http://localhost:30000/health", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      return NextResponse.json({ status: "ready" });
    } else {
      return NextResponse.json({ status: "loading" });
    }
  } catch (error) {
    // 捕获超时或连接拒绝等异常
    console.error("健康检查失败:", error);
    return NextResponse.json({ status: "loading" });
  }
}
