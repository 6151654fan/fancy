import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

// 强制动态执行，禁用服务端缓存
export const dynamic = "force-dynamic";

const execAsync = util.promisify(exec);

export async function GET(req: Request) {
  try {
    const { stdout } = await execAsync(
      "bash /home/ljb/scripts/sglang/docker_switch.sh --current-json",
    );
    const data = JSON.parse(stdout.trim());

    if (data) {
      // 保留原始 config 字段，同时也提供 currentModel 字段（去掉 .yaml 后缀）以保持兼容性
      if (data.config && data.config !== "none") {
        const modelName = data.config.replace(".yaml", "");
        return NextResponse.json({
          ...data,
          currentModel: modelName,
        });
      } else {
        // 处理 config 为 none 的情况
        return NextResponse.json({
          ...data,
          currentModel: null,
        });
      }
    }
    return NextResponse.json({
      config: "none",
      status: "stopped",
      currentModel: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { currentModel: null, error: error.message },
      { status: 500 },
    );
  }
}
