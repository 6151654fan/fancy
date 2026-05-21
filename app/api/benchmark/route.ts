import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 解析请求参数
    const body = await req.json();
    const { dataset, inputLen, outputLen, numPrompts, seed } = body;

    // 验证必要参数
    if (!dataset || !numPrompts) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // 构建基础命令
    //let command = `source /home/ljb/miniconda/bin/activate kt && cd /home/ljb/sglang && python -m sglang.bench_serving --backend sglang --host 0.0.0.0 --port 30000 --request-rate 1`;
    let command = `docker exec -i $(hostname) bash -c "source /home/ljb/miniconda/bin/activate kt && cd /home/ljb/sglang && python -m sglang.bench_serving --backend sglang --host 0.0.0.0 --port 30000 --request-rate 1"`;

    // 根据 dataset 类型拼接参数
    if (dataset === "random") {
      if (!inputLen || !outputLen) {
        return NextResponse.json(
          { error: "Missing inputLen or outputLen for random dataset" },
          { status: 400 },
        );
      }
      command += ` --dataset-name random --random-input-len ${inputLen} --random-output-len ${outputLen} --num-prompts ${numPrompts}`;
    } else if (dataset === "sharegpt") {
      if (!seed) {
        return NextResponse.json(
          { error: "Missing seed for sharegpt dataset" },
          { status: 400 },
        );
      }
      command += ` --dataset-name sharegpt --dataset-path ~/datasets/sharegpt/ShareGPT_V3_unfiltered_cleaned_split.json --num-prompts ${numPrompts} --seed ${seed}`;
    } else {
      return NextResponse.json(
        { error: "Invalid dataset type" },
        { status: 400 },
      );
    }

    // 创建 ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        // 执行 bash 命令
        const process = spawn("bash", ["-c", command]);

        // 监听 stdout
        process.stdout.on("data", (data) => {
          const text = data.toString();
          controller.enqueue(`data: ${text}\n\n`);
        });

        // 监听 stderr
        process.stderr.on("data", (data) => {
          const text = data.toString();
          controller.enqueue(`data: ${text}\n\n`);
        });

        // 监听 close 事件
        process.on("close", () => {
          controller.close();
        });

        // 监听 error 事件
        process.on("error", (error) => {
          console.error("Process error:", error);
          controller.enqueue(`data: Error: ${error.message}\n\n`);
          controller.close();
        });
      },
    });

    // 返回 SSE 响应
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
