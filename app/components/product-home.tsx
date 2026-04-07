import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chat";

// 设计系统
const theme = {
  primary: "rgb(29, 147, 171)",
  primaryDark: "rgb(22, 120, 140)",
  primaryGlow: "rgba(29, 147, 171, 0.5)",
  accent: "rgb(56, 189, 248)",
  bg: {
    primary: "#0a0e17",
    card: "rgba(15, 23, 42, 0.6)",
  },
  text: {
    primary: "#f8fafc",
    secondary: "#94a3b8",
    muted: "#64748b",
  },
  border: "rgba(148, 163, 184, 0.08)",
};

const css = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
@media (max-width: 900px) {
  [data-features-grid] { grid-template-columns: 1fr !important; }
}
@media (max-width: 700px) {
  [data-scenes-row] { grid-template-columns: repeat(2, 1fr) !important; }
}
@media (max-width: 500px) {
  [data-scenes-row] { grid-template-columns: 1fr !important; }
}
`;

export function ProductHomePage() {
  const navigate = useNavigate();
  const chatStore = useChatStore();

  return (
    <>
      <style>{css}</style>
      <div style={styles.page}>
        {/* 背景 */}
        <div style={styles.bg}>
          <div style={styles.bgNoise} />
          <div style={styles.bgGlow} />
        </div>

        {/* Hero */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            {/* Logo */}
            <div style={styles.logoWrap}>
              <img
                src="/company-logo-white.png"
                alt="FerroSemi"
                style={styles.logo}
              />
            </div>

            {/* Badge */}
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              单机部署最大 671B 级MoE大模型
            </div>

            {/* Title */}
            <h1 style={styles.title}>晶铁普惠AI一体机</h1>

            {/* Desc */}
            <p style={styles.desc}>
              面向政企与科研用户，单机支持{" "}
              <b style={{ color: theme.accent }}>DeepSeek-V3 / R1</b>{" "}
              级超大模型私有化部署
              <br />
              <span style={{ color: theme.text.muted }}>
                数据安全 · 成本可控 · 工程落地
              </span>
            </p>

            {/* Buttons */}
            <div style={styles.btns}>
              <button
                style={styles.btnMain}
                onClick={() => {
                  chatStore.newSession();
                  navigate(Path.Inference);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 12px 40px ${theme.primaryGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 4px 24px ${theme.primaryGlow}`;
                }}
              >
                开启推理对话
                <ArrowIcon />
              </button>
              <button
                style={styles.btnSub}
                onClick={() => navigate(Path.Showcase)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.primary;
                  e.currentTarget.style.color = theme.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(148, 163, 184, 0.2)";
                  e.currentTarget.style.color = theme.text.secondary;
                }}
              >
                样机展示
              </button>
            </div>
          </div>
        </section>

        {/* Features - 2x2 Grid */}
        <section style={styles.featuresSection}>
          <div style={styles.featuresHeader}>
            <h2 style={styles.featuresTitle}>核心技术</h2>
            <p style={styles.featuresSub}>突破传统限制，实现单机超大模型部署</p>
          </div>

          <div style={styles.featuresGrid} data-features-grid>
            <Feature
              num="01"
              title="CPU-GPU 异构卸载"
              desc="全量权重常驻主存，突破显存限制，671B 级模型单机运行"
            />
            <Feature
              num="02"
              title="OpenClaw 智能体生态"
              desc="OpenAI-compatible API，轻松对接政企 RAG 与自动化工作流"
            />
            <Feature
              num="03"
              title="私有安全可控"
              desc="模型、数据、日志全链路闭环，保障敏感数据不出域"
            />
            <Feature
              num="04"
              title="总体成本友好"
              desc="显著低于 H100 集群门槛，减少供电散热及运维复杂度"
            />
          </div>
        </section>

        {/* Scenes - 一行排列 */}
        <section style={styles.scenesSection}>
          <div style={styles.scenesHeader}>
            <h2 style={styles.scenesTitle}>应用场景</h2>
            <p style={styles.scenesSub}>一站式满足政企智能化转型需求</p>
          </div>

          <div style={styles.scenesRow} data-scenes-row>
            <Scene title="政企私有化问答" desc="政策制度与业务流程助手" />
            <Scene title="行业知识库 RAG" desc="海量文档智能检索" />
            <Scene title="企业 Agent 底座" desc="审批编排智能中枢" />
            <Scene title="科研验证评测" desc="模型基准测试平台" />
          </div>
        </section>

        {/* CTA */}
        <section style={styles.cta}>
          <div style={styles.ctaInner}>
            <h3 style={styles.ctaTitle}>准备好开始了吗？</h3>
            <p style={styles.ctaDesc}>立即体验满血版大模型推理能力</p>
            <button
              style={styles.ctaBtn}
              onClick={() => {
                chatStore.newSession();
                navigate(Path.Inference);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              立即开始
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

// Feature Card - 2x2
function Feature({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={styles.featureCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.borderColor = "rgba(29, 147, 171, 0.3)";
        (e.currentTarget.querySelector(
          ".feature-num",
        ) as HTMLElement)!.style.color = theme.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = theme.border;
        (e.currentTarget.querySelector(
          ".feature-num",
        ) as HTMLElement)!.style.color = theme.text.muted;
      }}
    >
      <div className="feature-num" style={styles.featureNum}>
        {num}
      </div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  );
}

// Scene Card - 横排
function Scene({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={styles.sceneCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.primary;
        e.currentTarget.style.background = "rgba(29, 147, 171, 0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.background = theme.bg.card;
      }}
    >
      <h4 style={styles.sceneTitle}>{title}</h4>
      <p style={styles.sceneDesc}>{desc}</p>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100%",
    background: theme.bg.primary,
    color: theme.text.primary,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    overflowY: "auto",
    position: "relative",
  },

  // Background
  bg: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  bgNoise: {
    position: "absolute",
    inset: 0,
    opacity: 0.02,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  },
  bgGlow: {
    position: "absolute",
    top: "-30%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "120%",
    height: "80%",
    background: `radial-gradient(ellipse at center, ${theme.primaryGlow} 0%, transparent 50%)`,
    filter: "blur(80px)",
    opacity: 0.3,
    animation: "pulse 8s ease-in-out infinite",
  },

  // Hero
  hero: {
    position: "relative",
    minHeight: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 32px 40px",
  },
  heroContent: {
    maxWidth: "720px",
    textAlign: "center",
    animation: "fadeUp 1s ease-out",
  },
  logoWrap: {
    marginBottom: "24px",
  },
  logo: {
    width: "auto",
    maxWidth: "280px",
    height: "auto",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 18px",
    marginBottom: "28px",
    fontSize: "13px",
    fontWeight: 500,
    color: theme.primary,
    background: "rgba(29, 147, 171, 0.08)",
    border: "1px solid rgba(29, 147, 171, 0.2)",
    borderRadius: "100px",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: theme.primary,
    boxShadow: `0 0 12px ${theme.primary}`,
    animation: "pulse 2s ease-in-out infinite",
  },
  title: {
    fontSize: "clamp(36px, 5vw, 52px)",
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: "20px",
    letterSpacing: "-0.03em",
    background: `linear-gradient(135deg, #fff 20%, ${theme.primary} 80%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  desc: {
    fontSize: "17px",
    lineHeight: 1.8,
    color: theme.text.secondary,
    marginBottom: "40px",
  },
  btns: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btnMain: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px 32px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff",
    background: theme.primary,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: `0 4px 24px ${theme.primaryGlow}`,
  },
  btnSub: {
    padding: "16px 32px",
    fontSize: "15px",
    fontWeight: 600,
    color: theme.text.secondary,
    background: "transparent",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  // Features
  featuresSection: {
    position: "relative",
    padding: "60px 32px 80px",
  },
  featuresHeader: {
    textAlign: "center",
    marginBottom: "48px",
  },
  featuresTitle: {
    fontSize: "32px",
    fontWeight: 600,
    marginBottom: "12px",
    letterSpacing: "-0.02em",
  },
  featuresSub: {
    fontSize: "15px",
    color: theme.text.muted,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  featureCard: {
    position: "relative",
    padding: "36px 32px",
    background: theme.bg.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "20px",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(12px)",
  },
  featureNum: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    marginBottom: "20px",
    transition: "color 0.3s ease",
  },
  featureTitle: {
    fontSize: "20px",
    fontWeight: 600,
    marginBottom: "12px",
    letterSpacing: "-0.01em",
  },
  featureDesc: {
    fontSize: "15px",
    lineHeight: 1.7,
    color: theme.text.secondary,
    margin: 0,
  },

  // Scenes
  scenesSection: {
    position: "relative",
    padding: "60px 32px",
    background:
      "linear-gradient(180deg, transparent 0%, rgba(29, 147, 171, 0.02) 100%)",
  },
  scenesHeader: {
    textAlign: "center",
    marginBottom: "40px",
  },
  scenesTitle: {
    fontSize: "32px",
    fontWeight: 600,
    marginBottom: "12px",
    letterSpacing: "-0.02em",
  },
  scenesSub: {
    fontSize: "15px",
    color: theme.text.muted,
  },
  scenesRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  sceneCard: {
    padding: "28px 24px",
    background: theme.bg.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    textAlign: "center",
    transition: "all 0.3s ease",
    backdropFilter: "blur(12px)",
  },
  sceneTitle: {
    fontSize: "15px",
    fontWeight: 600,
    marginBottom: "8px",
    color: theme.primary,
  },
  sceneDesc: {
    fontSize: "13px",
    color: theme.text.secondary,
    margin: 0,
  },

  // CTA
  cta: {
    position: "relative",
    padding: "120px 32px",
    textAlign: "center",
    background: `linear-gradient(180deg, transparent 0%, rgba(29, 147, 171, 0.06) 100%)`,
  },
  ctaInner: {
    maxWidth: "480px",
    margin: "0 auto",
  },
  ctaTitle: {
    fontSize: "32px",
    fontWeight: 600,
    marginBottom: "12px",
    letterSpacing: "-0.02em",
  },
  ctaDesc: {
    fontSize: "16px",
    color: theme.text.secondary,
    marginBottom: "36px",
  },
  ctaBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "18px 48px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#fff",
    background: theme.primary,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "transform 0.2s ease",
    boxShadow: `0 4px 24px ${theme.primaryGlow}`,
  },
};
