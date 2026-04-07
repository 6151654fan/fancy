import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import { useAccessStore } from "../store";

export function ShowcasePage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#fff",
        overflow: "hidden",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          padding: "20px 40px",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "40px",
          height: "100%",
        }}
      >
        {/* 左侧：物理形态 */}
        <div
          style={{ display: "flex", flexDirection: "column", height: "77%" }}
        >
          {/* 样机图片 */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "24px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              textAlign: "center" as const,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <img
              src="/device.png"
              alt="样机示意图"
              style={{
                width: "100%",
                maxHeight: "100%",
                height: "auto",
                borderRadius: "16px",
                objectFit: "contain",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                (e.currentTarget.nextSibling as HTMLElement).style.display =
                  "flex";
              }}
            />
            <div
              style={{
                display: "none",
                height: "300px",
                backgroundColor: "#e2e8f0",
                borderRadius: "16px",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              [ 样机示意图：支持 4U 机架/塔式灵活适配 ]
            </div>
            <p
              style={{ fontSize: "12px", color: "#94a3b8", marginTop: "16px" }}
            >
              示意图：实际交付机箱、面板接口可根据项目要求适配调整。
            </p>
          </div>
        </div>

        {/* 右侧：Datasheet 与硬件规格表 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            height: "100%",
          }}
        >
          {/* 性能口径 */}
          <div
            style={{
              padding: "28px",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "850",
                marginBottom: "20px",
                color: "#2563eb",
              }}
            >
              标准性能口径
            </h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <SpecItem label="支持模型" value="最大671B 级 FP8 MoE" />
              <SpecItem
                label="首 Token 延迟(TTFT)"
                value="8K上下文 < 12s,20K上下文 < 16s "
              />
              <SpecItem label="单会话吞吐" value="> 12 token/s" />
              <SpecItem label="总吞吐" value="> 24 token/s" />
              <SpecItem label="推荐服务并发" value="4 – 8 路" />
              <SpecItem label="批量预填充能力" value="> 1000 token/s" />
            </div>
          </div>

          {/* 硬件规格 */}
          <div
            style={{
              padding: "28px",
              backgroundColor: "#fafafa",
              borderRadius: "24px",
              border: "1px solid #f1f5f9",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "850",
                marginBottom: "20px",
                color: "#0f172a",
              }}
            >
              核心硬件规格
            </h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <SpecItem label="CPU" value="双路 AMD EPYC 9135 平台" />
              <SpecItem label="运行内存" value="1TB DDR5 ECC RDIMM" />
              <SpecItem label="GPU" value="RTX 4090 D 24GB × 2" />
              <SpecItem label="系统硬盘" value="≥ 2TB 企业级 NVMe SSD" />
              <SpecItem label="软件生态" value="Ubuntu 24.04 / 容器化部署" />
            </div>
          </div>

          {/* 跳转按钮 - 仅管理员可见 */}
          {accessStore.isAdmin() && (
            <button
              onClick={() => navigate(Path.Dashboard)}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "#0f172a",
                color: "#fff",
                borderRadius: "14px",
                border: "none",
                fontWeight: "800",
                cursor: "pointer",
                fontSize: "15px",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#1e293b")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#0f172a")
              }
            >
              进入实时性能监控面板
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 优化了对齐的 SpecItem 组件
function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span
        style={{
          width: "120px",
          color: "#64748b",
          fontSize: "14px",
          fontWeight: "600",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          flexGrow: 1,
          textAlign: "right" as const,
          fontWeight: "700",
          color: "#1e293b",
          fontSize: "14px",
        }}
      >
        {value}
      </span>
    </div>
  );
}
