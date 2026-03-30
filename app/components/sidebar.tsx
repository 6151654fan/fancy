import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import AddIcon from "../icons/add.svg";
import ArrowIcon from "../icons/arrow.svg";
import BotIcon from "../icons/bot.svg";
import DiscoveryIcon from "../icons/discovery.svg";
import ClawIcon from "../icons/openclaw.svg";
import DragIcon from "../icons/drag.svg";
import HomeIcon from "../icons/home.svg";
import ChartIcon from "../icons/chart.svg";
import UserIcon from "../icons/user.svg";
import LogoutIcon from "../icons/logout.svg";

import Locale from "../locales";

import { useAppConfig, useChatStore, useAccessStore } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  Path,
} from "../constant";

import { useLocation, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { isMcpEnabled } from "../mcp/actions";

const DEFAULT_OPENCLAW_URL = "http://localhost:18789/openclaw/";

function normalizeOpenclawUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_OPENCLAW_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

const DISCOVERY = [
  { name: Locale.Plugin.Name, path: Path.Plugins },
  { name: "Stable Diffusion", path: Path.Sd },
  { name: Locale.SearchChat.Page.Title, path: Path.SearchChat },
];

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

export function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

// 简化的侧边栏状态管理
export function useSideBarToggle() {
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();

  // 使用 sidebarCollapsed 配置项（需要添加到 config 中）
  const isCollapsed = config.sidebarCollapsed ?? false;

  const toggleSidebar = () => {
    config.update((config) => {
      config.sidebarCollapsed = !config.sidebarCollapsed;
    });
  };

  const openSidebar = () => {
    config.update((config) => {
      config.sidebarCollapsed = false;
    });
  };

  const closeSidebar = () => {
    config.update((config) => {
      config.sidebarCollapsed = true;
    });
  };

  useEffect(() => {
    const sideBarWidth = isMobileScreen
      ? "100vw"
      : isCollapsed
        ? "0px"
        : `${DEFAULT_SIDEBAR_WIDTH}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [isCollapsed, isMobileScreen]);

  return {
    isCollapsed,
    toggleSidebar,
    openSidebar,
    closeSidebar,
  };
}

export function SideBarContainer(props: {
  children: React.ReactNode;
  isCollapsed: boolean;
  onClose?: () => void;
  className?: string;
}) {
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );
  const { children, className, isCollapsed, onClose } = props;

  return (
    <>
      {/* 移动端遮罩层 */}
      {isMobileScreen && !isCollapsed && (
        <div
          className={clsx(styles["sidebar-overlay"], {
            [styles["sidebar-overlay-active"]]: !isCollapsed,
          })}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={clsx(styles.sidebar, className, {
          [styles["sidebar-collapsed"]]: isCollapsed,
        })}
        style={{
          transition: isMobileScreen && isIOSMobile ? "none" : undefined,
        }}
        role="navigation"
        aria-label="侧边栏导航"
      >
        {/* 收起按钮 */}
        <button
          className={styles["sidebar-collapse-btn"]}
          onClick={onClose}
          aria-label="收起侧边栏"
          type="button"
        >
          <ArrowIcon style={{ transform: "rotate(180deg)" }} />
        </button>
        {children}
      </div>
    </>
  );
}

export function SideBarHeader(props: {
  title?: string | React.ReactNode;
  subTitle?: string | React.ReactNode;
  logo?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { title, subTitle, logo, children } = props;
  return (
    <Fragment>
      <div
        className={styles["sidebar-header"]}
        data-tauri-drag-region
      >
        <div className={styles["sidebar-title-container"]}>
          <div className={styles["sidebar-title"]} data-tauri-drag-region>
            {title}
          </div>
          <div className={styles["sidebar-sub-title"]}>{subTitle}</div>
        </div>
        <div className={clsx(styles["sidebar-logo"], "no-dark")}>{logo}</div>
      </div>
      {children}
    </Fragment>
  );
}

export function SideBarBody(props: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) {
  const { onClick, children } = props;
  return (
    <div className={styles["sidebar-body"]} onClick={onClick}>
      {children}
    </div>
  );
}

export function SideBarTail(props: {
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  const { primaryAction, secondaryAction } = props;

  return (
    <div className={styles["sidebar-tail"]}>
      <div className={styles["sidebar-actions"]}>{primaryAction}</div>
      <div className={styles["sidebar-actions"]}>{secondaryAction}</div>
    </div>
  );
}

// 展开侧边栏按钮（在顶部导航栏使用）
export function SideBarToggleButton() {
  const { isCollapsed, openSidebar } = useSideBarToggle();

  if (!isCollapsed) return null;

  return (
    <button
      className={styles["sidebar-toggle-btn"]}
      onClick={openSidebar}
      aria-label="展开侧边栏导航"
      type="button"
    >
      <ArrowIcon />
    </button>
  );
}

// 菜单项配置
interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
  action?: () => void;
  adminOnly?: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  defaultExpanded?: boolean;
}

// 菜单配置
const MENU_GROUPS: MenuGroup[] = [
  {
    id: "navigation",
    label: "导航",
    icon: <DiscoveryIcon />,
    items: [
      { id: "product-home", icon: <HomeIcon />, label: "产品主页", path: Path.ProductHome },
      { id: "model-monitor", icon: <DiscoveryIcon />, label: "模型监控", path: Path.Dashboard, adminOnly: true },
      { id: "realtime-metrics", icon: <ChartIcon />, label: "实时指标", path: Path.Grafana, adminOnly: true },
      { id: "openclaw", icon: <ClawIcon />, label: "OpenClaw", path: Path.Openclaw },
      { id: "showcase", icon: <DragIcon />, label: "样机展示", path: Path.Showcase },
    ],
    defaultExpanded: true,
  },
];

// 菜单分组组件
function MenuGroupComponent({ group, isAdmin }: { group: MenuGroup; isAdmin: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const config = useAppConfig();
  const groupRef = useRef<HTMLDivElement>(null);

  // 检查当前路由是否匹配菜单项
  const isCurrentRoute = (item: MenuItem) => {
    if (!item.path) return false;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  // 检查是否有任何菜单项匹配当前路由，如果有则自动展开
  const hasActiveItem = group.items.some(item => !item.adminOnly || isAdmin ? isCurrentRoute(item) : false);

  const [isExpanded, setIsExpanded] = useState(group.defaultExpanded ?? hasActiveItem);

  const handleItemClick = (item: MenuItem) => {
    if (item.action === "openclaw") {
      const targetUrl = normalizeOpenclawUrl(config.openclawConfig?.url ?? DEFAULT_OPENCLAW_URL);
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // 键盘导航支持
  const handleKeyDown = (e: React.KeyboardEvent, item: MenuItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(item);
    }
  };

  // 展开/收起组键盘支持
  const handleGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else if (e.key === 'ArrowDown' && isExpanded) {
      e.preventDefault();
      const firstItem = groupRef.current?.querySelector('[data-menu-item]') as HTMLElement;
      firstItem?.focus();
    }
  };

  return (
    <div
      className={styles["sidebar-menu-group"]}
      ref={groupRef}
      role="menu"
      aria-label={group.label}
    >
      <div
        className={styles["sidebar-menu-group-header"]}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleGroupKeyDown}
        role="menuitem"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`menu-${group.id}`}
      >
        <span className={styles["sidebar-menu-group-icon"]}>{group.icon}</span>
        <span className={styles["sidebar-menu-group-label"]}>{group.label}</span>
        <ArrowIcon
          className={clsx(styles["sidebar-menu-group-arrow"], {
            [styles["expanded"]]: isExpanded,
          })}
          aria-hidden="true"
        />
      </div>
      <div
        id={`menu-${group.id}`}
        className={clsx(styles["sidebar-menu-group-items"], {
          [styles["visible"]]: isExpanded,
        })}
        role="group"
      >
        {group.items
          .filter(item => !item.adminOnly || isAdmin)
          .map((item, index) => {
            const isActive = isCurrentRoute(item);
            return (
              <div
                key={item.id}
                className={clsx(styles["sidebar-menu-item"], {
                  [styles["active"]]: isActive,
                })}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => handleKeyDown(e, item)}
                role="menuitem"
                tabIndex={isExpanded ? 0 : -1}
                data-menu-item
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={styles["sidebar-menu-item-icon"]}>{item.icon}</span>
                <span className={styles["sidebar-menu-item-label"]}>{item.label}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  useHotKey();
  const { isCollapsed, closeSidebar } = useSideBarToggle();
  const navigate = useNavigate();
  const config = useAppConfig();
  const chatStore = useChatStore();
  const accessStore = useAccessStore();
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isAdmin = accessStore.isAdmin();

  const openOpenclaw = () => {
    const targetUrl = normalizeOpenclawUrl(
      config.openclawConfig?.url ?? DEFAULT_OPENCLAW_URL,
    );
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const checkMcpStatus = async () => {
      const enabled = await isMcpEnabled();
      setMcpEnabled(enabled);
    };
    checkMcpStatus();
  }, []);

  return (
    <SideBarContainer
      isCollapsed={isCollapsed}
      onClose={closeSidebar}
      {...props}
    >
      <SideBarHeader
        title="普惠 AI 一体机"
        subTitle="您的本地私有化智能助手"
        // logo={<CompanyLogo />}
      />

      {/* 菜单区域 */}
      <div className={styles["sidebar-menu-container"]}>
        {MENU_GROUPS.map(group => (
          <MenuGroupComponent key={group.id} group={group} isAdmin={isAdmin} />
        ))}

        {/* 新建对话按钮 */}
        <div className={styles["sidebar-menu-divider"]} />
        <div
          className={styles["sidebar-new-chat-btn"]}
          onClick={() => {
            chatStore.newSession();
            navigate(Path.Chat);
          }}
        >
          <span className={styles["sidebar-menu-item-icon"]}><AddIcon /></span>
          <span className={styles["sidebar-menu-item-label"]}>新建对话</span>
        </div>
      </div>

      {/* 聊天列表区域 */}
      <div className={styles["sidebar-chat-list-container"]}>
        <div className={styles["sidebar-chat-list-header"]}>最近会话</div>
        <div className={styles["sidebar-chat-list-scroll"]}>
          <SideBarBody
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                navigate(Path.Home);
              }
            }}
          >
            <ChatList narrow={false} />
          </SideBarBody>
        </div>
      </div>

      {/* 用户信息和菜单 */}
      <div className={styles["sidebar-footer"]}>
        <div className={styles["sidebar-user-section"]}>
          <div
            className={styles["sidebar-user-info"]}
            onClick={() => setShowUserMenu(!showUserMenu)}
            tabIndex={0}
            role="button"
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
          >
            <div className={styles["sidebar-user-avatar"]}>
              <BotIcon />
            </div>
            <div className={styles["sidebar-user-text"]}>
              <div className={styles["sidebar-user-name"]}>
                {accessStore.userSession?.user?.username}
              </div>
              {accessStore.userSession?.user?.role === "admin" && (
                <div className={styles["sidebar-user-role"]}>管理员</div>
              )}
            </div>
          </div>

          {showUserMenu && (
            <>
              <div
                className={styles["sidebar-user-mask"]}
                onClick={() => setShowUserMenu(false)}
              />
              <div className={styles["sidebar-user-menu"]} role="menu">
                <div
                  className={styles["sidebar-user-menu-item"]}
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(Path.Settings);
                  }}
                  role="menuitem"
                  tabIndex={0}
                >
                  <SettingsIcon />
                  <span>设置</span>
                </div>
                {isAdmin && (
                  <div
                    className={styles["sidebar-user-menu-item"]}
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(Path.UserManagement);
                    }}
                    role="menuitem"
                    tabIndex={0}
                  >
                    <UserIcon />
                    <span>用户管理</span>
                  </div>
                )}
                <div className={styles["sidebar-menu-divider-line"]} />
                <div
                  className={clsx(styles["sidebar-user-menu-item"], styles.danger)}
                  onClick={() => {
                    setShowUserMenu(false);
                    accessStore.logout();
                    navigate(Path.Auth);
                  }}
                  role="menuitem"
                  tabIndex={0}
                >
                  <LogoutIcon />
                  <span>退出登录</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </SideBarContainer>
  );
}
