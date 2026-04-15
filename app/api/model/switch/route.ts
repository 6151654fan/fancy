import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelConfig } = body;

    if (!modelConfig) {
      return NextResponse.json(
        { error: "缺少 modelConfig 参数" },
        { status: 400 },
      );
    }

    // 执行模型切换脚本
    const command = `bash /home/ljb/scripts/sglang/switch_model_user.sh ${modelConfig}`;

    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("模型切换失败:", error, stderr);
          resolve(
            NextResponse.json(
              { error: stderr || "模型切换失败" },
              { status: 500 },
            ),
          );
        } else {
          console.log("模型切换成功:", stdout);
          resolve(NextResponse.json({ success: true }, { status: 200 }));
        }
      });
    });
  } catch (error) {
    console.error("请求处理失败:", error);
    return NextResponse.json({ error: "请求处理失败" }, { status: 500 });
  }
}
