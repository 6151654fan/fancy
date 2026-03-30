import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
import ShowcaseIcon from "../icons/showcase.svg";
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

// 侧边栏状态管理
export function useSideBarToggle() {
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
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
    // 收起时显示窄栏（72px），确保触摸友好
    const collapsedWidth = "72px";
    const sideBarWidth = isMobileScreen
      ? "100vw"
      : isCollapsed
        ? collapsedWidth
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
  onCollapse?: () => void;
  isCollapsed?: boolean;
}) {
  const { title, subTitle, logo, children, onCollapse, isCollapsed } = props;
  return (
    <Fragment>
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div className={styles["sidebar-header-main"]} data-tauri-drag-region>
          <div className={clsx(styles["sidebar-logo"], "no-dark")}>{logo}</div>
          {!isCollapsed && (
            <div className={styles["sidebar-title-container"]}>
              <div className={styles["sidebar-title"]} data-tauri-drag-region>
                {title}
              </div>
              <div className={styles["sidebar-sub-title"]}>{subTitle}</div>
            </div>
          )}
        </div>
        {!isCollapsed && onCollapse && (
          <button
            className={styles["sidebar-collapse-btn"]}
            onClick={onCollapse}
            aria-label="收起侧边栏"
            type="button"
          >
            <ArrowIcon style={{ transform: "rotate(180deg)" }} />
          </button>
        )}
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

// 菜单项配置
interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
  adminOnly?: boolean;
}

// 主导航菜单
const MENU_ITEMS: MenuItem[] = [
  { id: "product-home", icon: <HomeIcon />, label: "产品主页", path: Path.ProductHome },
  { id: "model-monitor", icon: <DiscoveryIcon />, label: "模型监控", path: Path.Dashboard, adminOnly: true },
  { id: "realtime-metrics", icon: <ChartIcon />, label: "实时指标", path: Path.Grafana, adminOnly: true },
  { id: "showcase", icon: <ShowcaseIcon />, label: "样机展示", path: Path.Showcase },
  { id: "openclaw", icon: <ClawIcon />, label: "OpenClaw", path: Path.Openclaw },
];

// 菜单项组件
function MenuItemComponent({
  item,
  isActive,
  onClick,
  isCollapsed
}: {
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
  isCollapsed?: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={clsx(styles["sidebar-menu-item"], {
        [styles["active"]]: isActive,
      })}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="menuitem"
      tabIndex={0}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? item.label : undefined}
    >
      <span className={styles["sidebar-menu-item-icon"]}>{item.icon}</span>
      {!isCollapsed && (
        <span className={styles["sidebar-menu-item-label"]}>{item.label}</span>
      )}
    </div>
  );
}

// 新建对话按钮组件 - 与菜单项结构一致
function NewChatButton({
  isCollapsed,
  onClick
}: {
  isCollapsed: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={styles["sidebar-new-chat-btn"]}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="新建对话"
      title={isCollapsed ? "新建对话" : undefined}
    >
      <span className={styles["sidebar-menu-item-icon"]}><AddIcon /></span>
      {!isCollapsed && (
        <span className={styles["sidebar-menu-item-label"]}>新建对话</span>
      )}
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  useHotKey();
  const { isCollapsed, closeSidebar } = useSideBarToggle();
  const navigate = useNavigate();
  const location = useLocation();
  const config = useAppConfig();
  const chatStore = useChatStore();
  const accessStore = useAccessStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const userSectionRef = useRef<HTMLDivElement>(null);
  const isAdmin = accessStore.isAdmin();

  // 计算菜单位置
  useEffect(() => {
    if (showUserMenu && userSectionRef.current) {
      const rect = userSectionRef.current.getBoundingClientRect();
      if (isCollapsed) {
        // 收起状态：菜单左侧对齐侧边栏左边缘，避免溢出屏幕
        const sidebarWidth = 72; // 收起状态侧边栏宽度
        const menuWidth = 140; // 菜单最小宽度
        setMenuStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + 8,
          left: Math.max(8, (sidebarWidth - menuWidth) / 2),
          width: 'max-content',
          minWidth: '140px',
        });
      } else {
        // 展开状态：菜单左对齐显示在用户区域上方
        setMenuStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    }
  }, [showUserMenu, isCollapsed]);

  const isCurrentRoute = (item: MenuItem) => {
    if (!item.path) return false;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleNewChat = () => {
    chatStore.newSession();
    navigate(Path.Chat);
  };

  return (
    <SideBarContainer
      isCollapsed={isCollapsed}
      onClose={closeSidebar}
      {...props}
    >
      {/* 头部区域 */}
      <SideBarHeader
        title="普惠 AI 一体机"
        subTitle="您的本地私有化智能助手"
        logo={<ChatGptIcon />}
        shouldNarrow={shouldNarrow}
      ></SideBarHeader>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* 新建对话按钮 - 放在侧边栏的最上方（聊天列表的顶部） */}
        <div
          style={{
            padding: "10px 20px 5px 20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <IconButton
            icon={<AddIcon />}
            text={shouldNarrow ? undefined : "新建对话"}
            className={styles["sidebar-new-chat-btn"]}
            onClick={() => {
              chatStore.newSession();
              navigate(Path.Chat);
            }}
            shadow
            style={{
              width: "100%",
              height: "40px",
            }}
          />
        </div>

        {/* 可滚动聊天列表 */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <SideBarBody
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                navigate(Path.Home);
              }
            }}
          >
            <ArrowIcon />
          </button>

          {/* 菜单项 */}
          {MENU_ITEMS
            .filter(item => !item.adminOnly || isAdmin)
            .map(item => (
              <MenuItemComponent
                key={item.id}
                item={item}
                isActive={isCurrentRoute(item)}
                onClick={() => handleMenuItemClick(item)}
                isCollapsed={isCollapsed}
              />
            ))}

          {/* 新建对话按钮 */}
          <NewChatButton isCollapsed={isCollapsed} onClick={handleNewChat} />
        </div>
      ) : (
        <>
          {/* 展开状态：主导航菜单 */}
          <div className={styles["sidebar-nav-section"]}>
            {MENU_ITEMS
              .filter(item => !item.adminOnly || isAdmin)
              .map(item => (
                <MenuItemComponent
                  key={item.id}
                  item={item}
                  isActive={isCurrentRoute(item)}
                  onClick={() => handleMenuItemClick(item)}
                  isCollapsed={isCollapsed}
                />
              ))}
          </div>

      {/* 自定义底部布局，不使用SideBarTail */}
      <div
        style={{
          paddingTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "20px 10px 10px 10px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* 设置按钮 - 移动到侧边栏最底部，放在用户信息区域上方 */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <IconButton
            icon={<SettingsIcon />}
            text={shouldNarrow ? undefined : "设置"}
            className={styles["sidebar-bar-button"]}
            onClick={() => navigate(Path.Settings)}
            shadow
            style={{ width: "80%" }}
          />
        </div>
      )}

      {/* 用户信息和菜单 */}
      <div className={styles["sidebar-footer"]} ref={userSectionRef}>
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
            {!isCollapsed && (
              <div className={styles["sidebar-user-text"]}>
                <div className={styles["sidebar-user-name"]}>
                  {accessStore.userSession?.user?.username}
                </div>
                {accessStore.userSession?.user?.role === "admin" && (
                  <div className={styles["sidebar-user-role"]}>管理员</div>
                )}
              </div>
            )}
          </div>

          {showUserMenu && createPortal(
            <>
              <div
                className={styles["sidebar-user-mask"]}
                onClick={() => setShowUserMenu(false)}
              />
              <div
                className={clsx(styles["sidebar-user-menu"], {
                  [styles["sidebar-user-menu-collapsed"]]: isCollapsed
                })}
                style={menuStyle}
                role="menu"
              >
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
            </>,
            document.body
          )}
        </div>
      </div>
    </SideBarContainer>
  );
}
