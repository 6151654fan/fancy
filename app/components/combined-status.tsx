import { useEffect } from "react";

import { useMonitorStore } from "@/app/store/monitor";

// =========================================
// 大模型推理一体机综合看板 (极致紧凑一屏版)
// =========================================

export function CombinedStatusPage() {
  const monitorStore = useMonitorStore();
  const { stats } = monitorStore; // 直接从全局获取数据

  const SERVER_IP = "192.168.1.93";
  const SERVER_PORT = "3001";

  const EMA_COEFF = 0.3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://${SERVER_IP}:${SERVER_PORT}/api/hardware`,
        );
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        monitorStore.updateStats({
          // 逻辑优化：如果是第一次获取数据(当前为0)，直接赋值，不走EMA平滑，防止2秒延迟感
          cpu:
            stats.cpu === 0
              ? data.cpu
              : Math.round(stats.cpu * (1 - EMA_COEFF) + data.cpu * EMA_COEFF),
          gpu:
            stats.gpu === 0
              ? data.gpu
              : Math.round(stats.gpu * (1 - EMA_COEFF) + data.gpu * EMA_COEFF),
          ram: data.ram,
          ramTotal: data.ramTotal || 1228,
          vram: data.vram,
          temp: data.temp || 0, // GPU温度
          cpuTemp: data.cpuTemp || 0, // [新增] 接收后端的 CPU 温度
          isConnected: true,
        });
      } catch (e) {
        monitorStore.updateStats({ isConnected: false });
      }
    };
    // 关键优化 1：组件挂载时立刻执行一次，不要等 1.5 秒
    fetchData();

    // 关键优化 2：持续轮询
    const timer = setInterval(fetchData, 1500);
    return () => clearInterval(timer);

    // 注意：这里监听 stats.cpu 是为了闭包能拿到最新的平滑值
  }, [stats.cpu, stats.gpu]);

  // 极致压缩的全局容器：使用 overflow: hidden 强制不滚动
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    color: "#1f2937",
    padding: "16px 24px", // 缩小外围边距
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  return (
    <div style={containerStyle as any}>
      {/* ==========================================
          第1部分：模型运行引擎状态
          ========================================== */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* 标题区 */}
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "850",
                color: "#0f172a",
                margin: 0,
              }}
            >
              模型运行引擎状态
            </h2>
          </div>
          <div
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: stats.isConnected ? "#ecfdf5" : "#f1f5f9",
              color: stats.isConnected ? "#059669" : "#64748b",
              border: `1px solid ${stats.isConnected ? "#10b981" : "#e2e8f0"}`,
            }}
          >
            引擎状态：{stats.isConnected ? "满血就绪" : "连接中"}
          </div>
        </div>

        {/* 拓扑图与性能表 (左右布局) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "16px",
          }}
        >
          {/* 左：2×2 信息卡片网格 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <MiniInfoCard
              label="推理后端"
              value="异构卸载内核"
              sub="GPU/CPU联合计算"
            />
            <MiniInfoCard label="量化精度" value="FP8 " sub="混合精度推理" />
            <MiniInfoCard
              label="上下文长度"
              value="32K / 64K"
              sub="标准/可选扩展"
            />
            <MiniInfoCard
              label="当前并发"
              value="4 - 8 路"
              sub="推荐服务区间"
            />
          </div>

          {/* 右：性能基线 */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "850",
                marginBottom: "16px",
                color: "#0f172a",
              }}
            >
              ▍ 推理引擎性能详情 (实测基线)
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                flexGrow: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <CompactDetailRow label="单会话输出吞吐:" value="> 12 tok/s" />
                <CompactDetailRow label="总吞吐:" value="> 24 tok/s" />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}
                  >
                    首 Token 延迟 (TTFT):
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      8K上下文
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "850",
                        color: "#3b82f6",
                      }}
                    >
                      {"<"} 12s
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      ,
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      20K上下文
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "850",
                        color: "#3b82f6",
                      }}
                    >
                      {"<"} 16s
                    </span>
                  </div>
                </div>
                <CompactDetailRow
                  label="批量预填充吞吐:"
                  value="> 1000 tok/s"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 超窄分割线 */}
      <div
        style={{
          borderTop: "1px solid #e2e8f0",
          margin: "16px 0",
          flexShrink: 0,
        }}
      ></div>

      {/* ==========================================
          第2部分：一体机实时性能监控
          ========================================== */}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "850",
                color: "#0f172a",
                margin: 0,
              }}
            >
              一体机实时性能监控
            </h2>
            <p
              style={{
                color: "#64748b",
                marginTop: "4px",
                fontSize: "13px",
                margin: "4px 0 0 0",
              }}
            >
              正在连接：双路 AMD EPYC 9135 + 1.2TB DDR5 + 双 RTX 4090D
            </p>
          </div>
          <div
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: stats.isConnected ? "#ecfdf5" : "#fef2f2",
              color: stats.isConnected ? "#059669" : "#dc2626",
              border: `1px solid ${stats.isConnected ? "#10b981" : "#f87171"}`,
            }}
          >
            ● {stats.isConnected ? "远程服务器已联通" : "尝试连接服务器中..."}
          </div>
        </div>

        {/* 资源监控网格 (3列2行布局，完美重构) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            flexGrow: 1,
          }}
        >
          {/* ----- 第一排：主机侧 (CPU & 内存) ----- */}
          <CompactStatCard
            title="CPU 综合负载"
            value={`${stats.cpu}%`}
            label="双路 EPYC 9135"
            progress={stats.cpu}
            color="#3b82f6"
          />
          <CompactStatCard
            title="CPU 核心温度"
            value={`${stats.cpuTemp || 0}°C`}
            label={(stats.cpuTemp || 0) > 75 ? "负载较高" : "散热良好"}
            progress={stats.cpuTemp || 0}
            color={(stats.cpuTemp || 0) > 65 ? "#f59e0b" : "#3b82f6"}
          />
          <CompactStatCard
            title="系统内存 (RAM)"
            value={`${stats.ram} GB`}
            label={`系统总内存量 ${stats.ramTotal} GB`}
            progress={(stats.ram / stats.ramTotal) * 100}
            color="#6366f1"
          />

          {/* ----- 第二排：设备侧 (GPU & 显存) ----- */}
          <CompactStatCard
            title="GPU 核心负载"
            value={`${stats.gpu}%`}
            label="双路 4090D"
            progress={stats.gpu}
            color="#8b5cf6"
          />
          <CompactStatCard
            title="GPU 核心温度"
            value={`${stats.temp}°C`}
            label={stats.temp > 75 ? "负载较高" : "散热良好"}
            progress={stats.temp}
            color={stats.temp > 65 ? "#f59e0b" : "#10b981"}
          />
          <CompactStatCard
            title="计算显存 (VRAM)"
            value={`${stats.vram} GB`}
            label="总显存 48GB"
            progress={(stats.vram / 48) * 100}
            color="#10b981"
          />
        </div>
      </div>
    </div>
  );
}

// =========================================
// 极致压缩的子组件集合
// =========================================

function MiniInfoCard({ label, value, sub }: any) {
  return (
    <div
      style={{
        padding: "12px 16px",
        backgroundColor: "#f0f9ff",
        border: "1px solid #dbeafe",
        borderRadius: "12px",
        boxShadow: "none",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          margin: "0 0 2px 0",
          fontWeight: "600",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "15px",
          fontWeight: "850",
          margin: "0 0 2px 0",
          color: "#0f172a",
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>{sub}</p>
    </div>
  );
}

function CompactProgress({ label, percent, value, desc, color }: any) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "700" }}>{label}</span>
        <span style={{ fontSize: "12px", fontWeight: "800", color: color }}>
          {value}
        </span>
      </div>
      <div
        style={{
          height: "6px",
          backgroundColor: "#e2e8f0",
          borderRadius: "3px",
          overflow: "hidden",
          marginBottom: "4px",
        }}
      >
        <div
          style={{
            width: `${Math.min(percent, 100)}%`,
            height: "100%",
            backgroundColor: color,
            transition: "width 1.5s ease",
          }}
        ></div>
      </div>
      <p style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>{desc}</p>
    </div>
  );
}

function CompactDetailRow({ label, value, valueStyle = {} }: any) {
  // 分离数字和单位
  const parseValue = (value: string) => {
    // 匹配数字部分（包括小数和范围）
    const numberMatch = value.match(/^([\d\s\-]+)/);
    if (numberMatch) {
      const numberPart = numberMatch[1];
      const unitPart = value.substring(numberPart.length);
      return { numberPart, unitPart };
    }
    return { numberPart: value, unitPart: "" };
  };

  const { numberPart, unitPart } = parseValue(value);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        paddingBottom: "6px",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "600" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span
          style={{
            color: "#0f172a",
            fontSize: "16px",
            fontWeight: "850",
            fontFamily: "'Roboto Mono', 'DIN', monospace",
            ...valueStyle,
          }}
        >
          {numberPart}
        </span>
        <span
          style={{
            color: "#94a3b8",
            fontSize: "11px",
            fontWeight: "500",
            fontFamily: "'Roboto Mono', 'DIN', monospace",
          }}
        >
          {unitPart}
        </span>
      </div>
    </div>
  );
}

function CompactStatCard({ title, value, label, progress, color }: any) {
  // 根据进度值确定渐变色
  const getProgressGradient = (progress: number) => {
    if (progress < 50) {
      // 低负载：品牌蓝渐变
      return "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)";
    } else if (progress < 80) {
      // 中负载：橙色渐变
      return "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)";
    } else {
      // 高负载：红色渐变
      return "linear-gradient(90deg, #ef4444 0%, #f87171 100%)";
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          marginBottom: "4px",
          fontWeight: "700",
        }}
      >
        {title}
      </p>
      <h3
        style={{
          fontSize: "24px",
          fontWeight: "850",
          margin: "0 0 8px 0",
          color: "#0f172a",
          fontFamily: "'Roboto Mono', 'DIN', monospace",
        }}
      >
        {value}
      </h3>
      <div
        style={{
          height: "10px",
          background: "#f1f5f9",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: `${Math.min(progress, 100)}%`,
            height: "100%",
            background: getProgressGradient(progress),
            borderRadius: "8px",
            transition: "width 1s ease",
          }}
        ></div>
      </div>
      <p
        style={{
          fontSize: "11px",
          color: "#64748b",
          fontWeight: "500",
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}
