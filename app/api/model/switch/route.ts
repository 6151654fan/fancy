import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { modelConfig } = body;

    if (!modelConfig) {
      return NextResponse.json(
        { error: "缺少 modelConfig 参数" },
        { status: 400 },
      );
    }

    // 执行模型切换脚本
    const command = `bash /home/ljb/scripts/sglang/switch_model_user.sh ${modelConfig}`;

    // 使用Promise包装exec调用
    const execPromise = new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("模型切换失败:", error, stderr);
            resolve({ success: false, error: stderr || "模型切换失败" });
          } else {
            console.log("模型切换成功:", stdout);
            resolve({ success: true });
          }
        });
      },
    );

    const result = await execPromise;

    if (result.success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("请求处理失败:", error);
    return NextResponse.json({ error: "请求处理失败" }, { status: 500 });
  }
}
