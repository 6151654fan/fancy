"use client";

require("../polyfill");

//import { ModelStatusPage } from "./model-status";

import { ShowcasePage } from "./showcase";

import { ProductHomePage } from "./product-home";

import { CombinedStatusPage } from "./combined-status";
import { GrafanaPage } from "./grafana";
import { UserManagementPage } from "./user-management";
import { OpenclawPage } from "./openclaw";
import { Benchmark } from "./benchmark";

//import { MonitorPage } from "./monitor";

import { useEffect, useState } from "react";
import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getISOLang, getLang } from "../locales";

import {
  HashRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";

import { getClientConfig } from "../config/client";
import { type ClientApi, getClientApi } from "../client/api";
import { useAccessStore } from "../store";
import clsx from "clsx";
import { initializeMcpSystem, isMcpEnabled } from "../mcp/actions";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Artifacts = dynamic(async () => (await import("./artifacts")).Artifacts, {
  loading: () => <Loading noLogo />,
});

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const PluginPage = dynamic(async () => (await import("./plugin")).PluginPage, {
  loading: () => <Loading noLogo />,
});

const SearchChat = dynamic(
  async () => (await import("./search-chat")).SearchChatPage,
  {
    loading: () => <Loading noLogo />,
  },
);

const Sd = dynamic(async () => (await import("./sd")).Sd, {
  loading: () => <Loading noLogo />,
});

const McpMarketPage = dynamic(
  async () => (await import("./mcp-market")).McpMarketPage,
  {
    loading: () => <Loading noLogo />,
  },
);

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const isArtifact = location.pathname.includes(Path.Artifacts);
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isSd = location.pathname === Path.Sd;
  const isSdNew = location.pathname === Path.SdNew;

  const isMobileScreen = useMobileScreen();
  const shouldTightBorder =
    getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  // 检查用户是否已登录 - 已绕过鉴权，直接渲染主界面
  useEffect(() => {
    // 强制跳过登录检查，直接设置一个模拟的用户会话
    const mockSession = {
      user: { username: "测试用户", role: "user" },
      token: "mock-token",
    };
    localStorage.setItem("userSession", JSON.stringify(mockSession));
    useAccessStore.getState().login(mockSession);
  }, []);

  if (isArtifact) {
    return (
      <Routes>
        <Route path="/artifacts/:id" element={<Artifacts />} />
      </Routes>
    );
  }

  // 顶部导航栏组件
  // const TopNavigation = () => {
  //   const navigate = useNavigate();
  //   const location = useLocation();
  //   const config = useAppConfig();
  //   const accessStore = useAccessStore();

  //   const DEFAULT_OPENCLAW_URL = "http://localhost:18789/openclaw/";

  //   function normalizeOpenclawUrl(url: string) {
  //     const trimmed = url.trim();
  //     if (!trimmed) return DEFAULT_OPENCLAW_URL;
  //     if (/^https?:\/\//i.test(trimmed)) return trimmed;
  //     return `http://${trimmed}`;
  //   }

  //   // 检查当前路径是否与按钮路径匹配
  //   const isActive = (path: string) => {
  //     // 当路径为 Path.Chat 或 Path.Home 时，也将“推理服务”按钮视为活动状态
  //     if (
  //       path === Path.Inference &&
  //       (location.pathname === Path.Chat || location.pathname === Path.Home)
  //     ) {
  //       return true;
  //     }
  //     return location.pathname === path;
  //   };

  //   return (
  //     <div className={styles["top-nav"]}>
  //       <div className={styles["top-nav-buttons"]}>
  //         <IconButton
  //           icon={<DiscoveryIcon />}
  //           text="产品主页"
  //           onClick={() => navigate(Path.ProductHome)}
  //           className={clsx(styles["top-nav-button"], {
  //             [styles["top-nav-button-active"]]: isActive(Path.ProductHome),
  //           })}
  //         />
  //         <IconButton
  //           icon={<McpIcon />}
  //           text="推理服务"
  //           onClick={() => navigate(Path.Inference)}
  //           className={clsx(styles["top-nav-button"], {
  //             [styles["top-nav-button-active"]]: isActive(Path.Inference),
  //           })}
  //         />
  //         {accessStore.isAdmin() && (
  //           <>
  //             <IconButton
  //               icon={<AddIcon />}
  //               text="模型监控"
  //               onClick={() => navigate(Path.Dashboard)}
  //               className={clsx(styles["top-nav-button"], {
  //                 [styles["top-nav-button-active"]]: isActive(Path.Dashboard),
  //               })}
  //             />
  //             <IconButton
  //               icon={<DiscoveryIcon />}
  //               text="实时指标"
  //               onClick={() => navigate(Path.Grafana)}
  //               className={clsx(styles["top-nav-button"], {
  //                 [styles["top-nav-button-active"]]: isActive(Path.Grafana),
  //               })}
  //             />
  //             <IconButton
  //               icon={<McpIcon />}
  //               text="用户管理"
  //               onClick={() => navigate(Path.UserManagement)}
  //               className={clsx(styles["top-nav-button"], {
  //                 [styles["top-nav-button-active"]]: isActive(
  //                   Path.UserManagement,
  //                 ),
  //               })}
  //             />
  //           </>
  //         )}
  //         <IconButton
  //           icon={<McpIcon />}
  //           text="Openclaw"
  //           onClick={() => {
  //             const targetUrl = normalizeOpenclawUrl(
  //               config.openclawConfig?.url ?? DEFAULT_OPENCLAW_URL,
  //             );
  //             window.open(targetUrl, "_blank", "noopener,noreferrer");
  //           }}
  //           className={styles["top-nav-button"]}
  //         />
  //         <IconButton
  //           icon={<DragIcon />}
  //           text="样机展示"
  //           onClick={() => navigate(Path.Showcase)}
  //           className={clsx(styles["top-nav-button"], {
  //             [styles["top-nav-button-active"]]: isActive(Path.Showcase),
  //           })}
  //         />
  //       </div>
  //     </div>
  //   );
  // };

  const renderContent = () => {
    // 永久跳过登录页面，直接渲染主界面
    if (isAuth) navigate(Path.Home);
    return (
      <>
        {!isSd && !isSdNew && (
          <SideBar
            className={clsx({
              [styles["sidebar-show"]]: isHome,
            })}
          />
        )}
        <WindowContent>
          <Routes>
            <Route path={Path.Home} element={<Chat />} />
            <Route path={Path.NewChat} element={<NewChat />} />
            <Route path={Path.Masks} element={<MaskPage />} />
            <Route path={Path.Plugins} element={<PluginPage />} />
            <Route path={Path.SearchChat} element={<SearchChat />} />
            <Route path={Path.Chat} element={<Chat />} />
            <Route path={Path.Settings} element={<Settings />} />
            <Route path={Path.McpMarket} element={<McpMarketPage />} />
            <Route path={Path.Sd} element={<Sd />} />
            <Route path={Path.SdNew} element={<Sd />} />
            {/* --- 新增演示流程路由 --- */}
            {/* <Route path={Path.Monitor} element={<MonitorPage />} /> */}
            <Route path={Path.ProductHome} element={<ProductHomePage />} />
            {/* <Route path={Path.ModelStatus} element={<ModelStatusPage />} /> */}
            <Route path={Path.Dashboard} element={<CombinedStatusPage />} />
            <Route path={Path.Grafana} element={<GrafanaPage />} />
            <Route path={Path.Inference} element={<Chat />} />{" "}
            {/* 推理直接复用 Chat 组件 */}
            <Route path={Path.Showcase} element={<ShowcasePage />} />
            <Route
              path={Path.UserManagement}
              element={<UserManagementPage />}
            />
            <Route path={Path.Openclaw} element={<OpenclawPage />} />
            <Route path={Path.Benchmark} element={<Benchmark />} />
          </Routes>
        </WindowContent>
      </>
    );
  };

  return (
    <div
      className={clsx(styles.container, {
        [styles["tight-container"]]: shouldTightBorder,
        [styles["rtl-screen"]]: getLang() === "ar",
      })}
    >
      {renderContent()}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  const api: ClientApi = getClientApi(config.modelConfig.providerName);

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();

    const initMcp = async () => {
      try {
        const enabled = await isMcpEnabled();
        if (enabled) {
          console.log("[MCP] initializing...");
          await initializeMcpSystem();
          console.log("[MCP] initialized");
        }
      } catch (err) {
        console.error("[MCP] failed to initialize:", err);
      }
    };
    initMcp();
  }, []);

  if (!useHasHydrated()) {
    return <Loading noLogo />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
