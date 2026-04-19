import { NextResponse } from "next/server";

// 强制动态执行，禁用服务端缓存
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // 创建一个带超时的fetch请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

    const response = await fetch("http://localhost:30000/health", {
      signal: controller.signal,
      cache: "no-store",
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
