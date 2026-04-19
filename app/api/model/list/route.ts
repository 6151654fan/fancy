import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { stdout } = await execAsync(
      "bash /home/ljb/scripts/sglang/switch_model_user.sh --list-json",
    );

    // 解析脚本返回的 JSON 数据
    let models = [];
    try {
      const parsed = JSON.parse(stdout.trim());
      // 兼容脚本可能返回 ["a", "b"] 或者 { models: ["a", "b"] } 的情况
      models = Array.isArray(parsed) ? parsed : parsed.models || [];
    } catch (parseError) {
      console.error("Failed to parse JSON from script:", stdout);
      // 降级方案：如果 JSON 解析失败，尝试按换行符分割纯文本
      models = stdout
        .split("\n")
        .map((m) => m.trim())
        .filter((m) => m.length > 0 && m.endsWith(".yaml"));
    }

    return NextResponse.json({ models });
  } catch (error: any) {
    console.error("Failed to execute list script:", error);
    return NextResponse.json(
      { models: [], error: error.message },
      { status: 500 },
    );
  }
}
