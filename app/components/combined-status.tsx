import { useEffect, useState } from "react";

// =========================================
// 模型切换页面
// =========================================

export function CombinedStatusPage() {
  const [currentModel, setCurrentModel] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [healthCheckInterval, setHealthCheckInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [switchTimeout, setSwitchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [serviceOutput, setServiceOutput] = useState<string>("");
  const [isServiceLoading, setIsServiceLoading] = useState<boolean>(false);

  // 模型切换函数
  const handleSwitchModel = (modelConfig: string) => {
    // 清除之前的定时器
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      setHealthCheckInterval(null);
    }
    if (switchTimeout) {
      clearTimeout(switchTimeout);
      setSwitchTimeout(null);
    }

    setIsSwitching(true);
    setCurrentModel(modelConfig);

    // 发送切换命令 (不要 await 它，或者 catch 它的超时，因为后端脚本可能执行很久)
    fetch("/api/model/switch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ modelConfig: modelConfig }),
    }).catch(console.error);

    // 延迟 30 秒后再开始轮询，避开“旧模型”的临死挣扎期
    const delayTimeout = setTimeout(() => {
      // 启动轮询健康检查
      const interval = setInterval(async () => {
        try {
          const healthResponse = await fetch(
            "/api/model/health?t=" + Date.now(),
            { cache: "no-store" },
          );
          const healthData = await healthResponse.json();

          if (healthData.status === "ready") {
            // 模型切换成功
            clearInterval(interval);
            setHealthCheckInterval(null);
            setIsSwitching(false);
            alert("模型切换成功！");
          }
        } catch (error) {
          // 健康检查失败，继续轮询
          console.log("健康检查中...");
        }
      }, 3000); // 每3秒轮询一次

      setHealthCheckInterval(interval);

      // 设置20分钟超时
      const timeout = setTimeout(
        () => {
          if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
            setHealthCheckInterval(null);
          }
          setIsSwitching(false);
          alert("模型切换超时，请检查服务器状态");
        },
        20 * 60 * 1000,
      ); // 20分钟

      setSwitchTimeout(timeout);
    }, 30000); // 核心修复：死等 30 秒

    // 保存延迟定时器，以便在组件卸载时清理
    setSwitchTimeout(delayTimeout);
  };

  // 服务控制函数
  const handleServiceControl = async (action: string) => {
    setIsServiceLoading(true);
    setServiceOutput("");

    try {
      const response = await fetch("/api/service-control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.status === 429) {
        setServiceOutput("操作过于频繁，请一小时后再试\n");
        setIsServiceLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setServiceOutput("无法获取响应流\n");
        setIsServiceLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setServiceOutput((prev) => prev + text);
      }
    } catch (error) {
      setServiceOutput(`Error: ${(error as Error).message}\n`);
    } finally {
      setIsServiceLoading(false);
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
      if (switchTimeout) {
        clearTimeout(switchTimeout);
      }
    };
  }, [healthCheckInterval, switchTimeout]);

  // 组件挂载时获取当前模型配置和模型列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 并行拉取当前模型和列表数据
        const [currentData, listData] = await Promise.all([
          fetch("/api/model/current", { cache: "no-store" }).then((res) =>
            res.json(),
          ),
          fetch(`/api/model/list?t=${Date.now()}`, { cache: "no-store" }).then(
            (res) => res.json(),
          ),
        ]);

        // 处理当前模型数据
        if (currentData) {
          if (currentData.config && currentData.config !== "none") {
            // 存储不带 .yaml 后缀的模型名用于显示
            setCurrentModel(currentData.config.replace(".yaml", ""));
          } else {
            // 处理 config 为 none 的情况
            setCurrentModel("");
          }
        }
        // 处理可用模型列表
        if (listData?.models?.length > 0) {
          // 存储完整的模型名（带 .yaml 后缀）用于调用 API
          setAvailableModels(listData.models);
        }
      } catch (e) {
        console.error("Failed to fetch model data", e);
      }
    };

    fetchData();
  }, []);

  // 容器样式
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#ffffff",
    overflow: "auto",
    color: "#1f2937",
    padding: "24px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  return (
    <div style={containerStyle as any}>
      {/* 标题区 */}
      <div
        style={{
          marginBottom: "24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "850",
            color: "#0f172a",
            margin: "0 0 8px 0",
          }}
        >
          模型切换
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            margin: 0,
          }}
        >
          选择要加载的模型，切换过程可能需要数分钟
        </p>
      </div>

      {/* 模型切换面板 */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "24px",
          backgroundColor: "#f8fafc",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#0f172a",
              margin: 0,
            }}
          >
            可用模型
          </h2>
          {isSwitching && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid #3b82f6",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              <span
                style={{
                  fontSize: "12px",
                  color: "#3b82f6",
                  fontWeight: "600",
                }}
              >
                正在加载模型权重到显存，预计需要几分钟...
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {availableModels.length === 0 ? (
            <div
              style={{
                color: "#64748b",
                fontSize: "14px",
                width: "100%",
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              正在加载可用模型列表...
            </div>
          ) : (
            availableModels.map((config) => {
              const displayName = config.replace(".yaml", "");
              return (
                <button
                  key={config}
                  onClick={() => {
                    const confirmed = window.confirm(
                      `确定要切换到模型 ${displayName} 吗？\n\n警告：切换模型将导致当前服务重启，加载过程可能需要数分钟，请确认！`,
                    );
                    if (confirmed) {
                      handleSwitchModel(config);
                    }
                  }}
                  disabled={isSwitching || currentModel === displayName}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    backgroundColor:
                      currentModel === displayName ? "#3b82f6" : "#ffffff",
                    color: currentModel === displayName ? "#ffffff" : "#1f2937",
                    border: `1px solid ${
                      currentModel === displayName ? "#3b82f6" : "#e2e8f0"
                    }`,
                    cursor:
                      isSwitching || currentModel === displayName
                        ? "not-allowed"
                        : "pointer",
                    opacity: isSwitching ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {displayName}
                </button>
              );
            })
          )}
        </div>

        {/* 当前模型信息区块 */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "0 0 8px 0",
            }}
          >
            当前模型
          </p>
          <p
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              margin: 0,
            }}
          >
            {currentModel || "暂无运行中的模型"}
          </p>
        </div>

        {/* 服务控制区块 */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "0 0 12px 0",
            }}
          >
            Docker 服务控制
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <button
              onClick={() => handleServiceControl("start")}
              disabled={isServiceLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "#10b981",
                color: "#ffffff",
                border: "none",
                cursor: isServiceLoading ? "not-allowed" : "pointer",
                opacity: isServiceLoading ? 0.6 : 1,
              }}
            >
              启动服务
            </button>
            <button
              onClick={() => handleServiceControl("stop")}
              disabled={isServiceLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                cursor: isServiceLoading ? "not-allowed" : "pointer",
                opacity: isServiceLoading ? 0.6 : 1,
              }}
            >
              停止服务
            </button>
            <button
              onClick={() => handleServiceControl("restart")}
              disabled={isServiceLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "#f59e0b",
                color: "#ffffff",
                border: "none",
                cursor: isServiceLoading ? "not-allowed" : "pointer",
                opacity: isServiceLoading ? 0.6 : 1,
              }}
            >
              重启服务
            </button>
            <button
              onClick={() => handleServiceControl("status")}
              disabled={isServiceLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "#6366f1",
                color: "#ffffff",
                border: "none",
                cursor: isServiceLoading ? "not-allowed" : "pointer",
                opacity: isServiceLoading ? 0.6 : 1,
              }}
            >
              查看状态
            </button>
          </div>
          <pre
            style={{
              backgroundColor: "#000000",
              color: "#4ade80",
              fontFamily: "'Courier New', Courier, monospace",
              padding: "16px",
              borderRadius: "8px",
              overflowY: "auto",
              height: "256px",
              margin: 0,
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            {serviceOutput || "等待操作..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
