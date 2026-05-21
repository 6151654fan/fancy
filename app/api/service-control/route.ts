import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

// 移除 ANSI 控制字符的函数
function removeAnsiCodes(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

const rateLimitStore = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!["start", "stop", "restart", "status"].includes(action)) {
      return NextResponse.json({ error: "无效的指令" }, { status: 400 });
    }

    if (action !== "status") {
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      let userLogs = rateLimitStore.get(ip) || [];
      userLogs = userLogs.filter((time) => now - time < oneHour);

      if (userLogs.length >= 30) {
        return NextResponse.json(
          { error: "操作过于频繁，请一小时后再试" },
          { status: 429 },
        );
      }
      userLogs.push(now);
      rateLimitStore.set(ip, userLogs);
    }

    const scriptPath = "/home/ljb/scripts/sglang/docker_switch.sh";

    const stream = new ReadableStream({
      start(controller) {
        const child = spawn("bash", [scriptPath, `--${action}`]);

        child.stdout.on("data", (data) => {
          const text = removeAnsiCodes(data.toString());
          controller.enqueue(new TextEncoder().encode(text));
        });
        child.stderr.on("data", (data) => {
          const text = removeAnsiCodes(data.toString());
          controller.enqueue(new TextEncoder().encode(text));
        });
        child.on("close", (code) => {
          controller.enqueue(
            new TextEncoder().encode(`\n[执行完毕，退出码：${code}]\n`),
          );
          controller.close();
        });
        child.on("error", (err) => {
          controller.enqueue(
            new TextEncoder().encode(`\n[执行出错：${err.message}]\n`),
          );
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
