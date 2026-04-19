import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

// 强制动态执行，禁用服务端缓存
export const dynamic = "force-dynamic";

const execAsync = util.promisify(exec);

export async function GET(req: Request) {
  try {
    const { stdout } = await execAsync(
      "bash /home/ljb/scripts/sglang/switch_model_user.sh --current-json",
    );
    const data = JSON.parse(stdout.trim());

    if (data && data.config) {
      const modelName = data.config.replace(".yaml", "");
      return NextResponse.json({
        currentModel: modelName,
        status: data.status,
      });
    }
    return NextResponse.json({ currentModel: null });
  } catch (error: any) {
    return NextResponse.json(
      { currentModel: null, error: error.message },
      { status: 500 },
    );
  }
}
