import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import AddIcon from "../icons/add.svg";
import ArrowIcon from "../icons/arrow.svg";
import BotIcon from "../icons/bot.svg";
import UserIcon from "../icons/user.svg";
import LogoutIcon from "../icons/logout.svg";

import { useAppConfig, useChatStore, useAccessStore } from "../store";

import { DEFAULT_SIDEBAR_WIDTH, Path } from "../constant";

import { useLocation, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import clsx from "clsx";

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
// 侧边栏状态管理
export function useSideBarToggle() {
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();

  // 加上 (config as any) 绕过 TypeScript 的严格检查
  const isCollapsed = (config as any).sidebarCollapsed ?? false;

  const toggleSidebar = () => {
    config.update((c) => {
      (c as any).sidebarCollapsed = !(c as any).sidebarCollapsed;
    });
  };

  const openSidebar = () => {
    config.update((c) => {
      (c as any).sidebarCollapsed = false;
    });
  };

  const closeSidebar = () => {
    config.update((c) => {
      (c as any).sidebarCollapsed = true;
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
        {isCollapsed ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div className={clsx(styles["sidebar-logo"], "no-dark")}>
              {logo}
            </div>
            {onCollapse && (
              <button
                className={styles["sidebar-collapse-btn"]}
                onClick={onCollapse}
                aria-label="展开侧边栏"
                type="button"
              >
                <ArrowIcon style={{ transform: "rotate(0deg)" }} />
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={styles["sidebar-header-main"]}
              data-tauri-drag-region
            >
              <div className={clsx(styles["sidebar-logo"], "no-dark")}>
                {logo}
              </div>
              <div className={styles["sidebar-title-container"]}>
                <div className={styles["sidebar-title"]} data-tauri-drag-region>
                  {title}
                </div>
                <div className={styles["sidebar-sub-title"]}>{subTitle}</div>
              </div>
            </div>
            {onCollapse && (
              <button
                className={styles["sidebar-collapse-btn"]}
                onClick={onCollapse}
                aria-label="收起侧边栏"
                type="button"
              >
                <ArrowIcon style={{ transform: "rotate(180deg)" }} />
              </button>
            )}
          </>
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
  {
    id: "model-monitor",
    icon: <SettingsIcon />,
    label: "切换模型",
    path: Path.Dashboard,
    adminOnly: true,
  },
];

// 菜单项组件
function MenuItemComponent({
  item,
  isActive,
  onClick,
  isCollapsed,
}: {
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
  isCollapsed?: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
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
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? item.label : undefined}
      style={
        isCollapsed
          ? {
              justifyContent: "center",
              paddingLeft: 0,
              paddingRight: 0,
            }
          : undefined
      }
    >
      <span className={styles["sidebar-menu-item-icon"]}>{item.icon}</span>
      {!isCollapsed && (
        <span className={styles["sidebar-menu-item-label"]}>{item.label}</span>
      )}
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  useHotKey();
  const { isCollapsed, closeSidebar, toggleSidebar } = useSideBarToggle();
  const navigate = useNavigate();
  const location = useLocation();
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
        const sidebarWidth = 72;
        const menuWidth = 140;
        setMenuStyle({
          position: "fixed",
          bottom: window.innerHeight - rect.top + 8,
          left: Math.max(8, (sidebarWidth - menuWidth) / 2),
          width: "max-content",
          minWidth: "140px",
        });
      } else {
        // 展开状态：菜单左对齐显示在用户区域上方
        setMenuStyle({
          position: "fixed",
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    }
  }, [showUserMenu, isCollapsed]);

  const isCurrentRoute = (item: MenuItem) => {
    if (!item.path) return false;
    return (
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/")
    );
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
    }
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
        logo={<BotIcon />}
        isCollapsed={isCollapsed}
        onCollapse={toggleSidebar}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* 容器 A (固定区)：新建对话按钮 + 主导航菜单 */}
        <div style={{ flexShrink: 1, flexGrow: 0 }}>
          {/* 新建对话按钮 */}
          <div
            style={{
              padding: isCollapsed ? "10px 0 5px 0" : "10px 20px 5px 20px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <IconButton
              icon={<AddIcon />}
              text={isCollapsed ? undefined : "新建对话"}
              className={styles["sidebar-new-chat-btn"]}
              onClick={() => {
                const chatStore = useChatStore.getState();

                // 判断当前是否已经在聊天主界面
                const isChatRoute =
                  location.pathname === Path.Chat ||
                  location.pathname === Path.Inference;

                if (!isChatRoute) {
                  // 如果在设置页等其他页面，复用主页的成功经验：带参数跳转，把新建任务交给目标页
                  navigate(`${Path.Inference}?action=new`);
                } else {
                  // 如果已经在聊天页，使用异步微小延时避开 React 当前的渲染冲突
                  setTimeout(() => {
                    chatStore.newSession();
                    chatStore.selectSession(0); // 强制锁定指针
                  }, 50);
                }
              }}
              shadow
              style={{
                width: "100%",
                height: "40px",
              }}
            />
          </div>

          {/* 主导航菜单 */}
          <div className={styles["sidebar-nav-section"]}>
            {MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
              (item) => (
                <MenuItemComponent
                  key={item.id}
                  item={item}
                  isActive={isCurrentRoute(item)}
                  onClick={() => handleMenuItemClick(item)}
                  isCollapsed={isCollapsed}
                />
              ),
            )}
          </div>
        </div>

        {/* 容器 B (滚动区)：仅包含 ChatList */}
        <div
          style={{ flex: 1, overflowY: "auto" }}
          className={styles["sidebar-scroll-container"]}
        >
          {/* 对话列表组件 - 仅在展开状态显示 */}
          {!isCollapsed && (
            <SideBarBody>
              <ChatList narrow={isCollapsed} />
            </SideBarBody>
          )}
        </div>

        {/* 底部用户区域 */}
        <div className={styles["sidebar-footer"]} ref={userSectionRef}>
          <div className={styles["sidebar-user-section"]}>
            <div
              className={styles["sidebar-user-info"]}
              style={
                isCollapsed
                  ? {
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      paddingLeft: 0,
                      width: "100%",
                      gap: "2px",
                    }
                  : {}
              }
              onClick={() => setShowUserMenu(!showUserMenu)}
              tabIndex={0}
              role="button"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              {isCollapsed ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {accessStore.userSession?.user?.username?.slice(0, 2) ||
                      "用户"}
                  </div>
                  {accessStore.userSession?.user?.role === "admin" && (
                    <div
                      style={{
                        fontSize: "10px",
                        zoom: 0.8,
                        textAlign: "center",
                        opacity: 0.8,
                        color: "#3b82f6",
                      }}
                    >
                      管理员
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className={styles["sidebar-user-avatar"]}>
                    <BotIcon />
                  </div>
                  <div className={styles["sidebar-user-text"]}>
                    <div className={styles["sidebar-user-name"]}>
                      {accessStore.userSession?.user?.username || "未登录"}
                    </div>
                    {accessStore.userSession?.user?.role === "admin" && (
                      <div className={styles["sidebar-user-role"]}>管理员</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 弹出的用户菜单 */}
            {showUserMenu &&
              createPortal(
                <>
                  <div
                    className={styles["sidebar-user-mask"]}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div
                    className={clsx(styles["sidebar-user-menu"], {
                      [styles["sidebar-user-menu-collapsed"]]: isCollapsed,
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
                      className={clsx(
                        styles["sidebar-user-menu-item"],
                        styles.danger,
                      )}
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
                document.body,
              )}
          </div>
        </div>
      </div>
    </SideBarContainer>
  );
}

export function useDragSideBar() {
  return {
    onDragStart: undefined,
    onDragEnd: undefined,
    shouldNarrow: false,
  };
}

export function SideBarTail(props: {
  primaryAction?: any;
  secondaryAction?: any;
}) {
  return null; // 我们其实不需要渲染它，只要骗过类型检查就行
}
