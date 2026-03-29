import styles from "./auth.module.scss";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { getClientConfig } from "../config/client";
import { LoginRequest } from "../types/auth";
import companyLogoPng from "../icons/brand/company-logo-white.png";
import EyeIcon from "../icons/eye.svg";
import EyeOffIcon from "../icons/eye-off.svg";

export function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
  }, [navigate]);

  // 实时验证用户名
  const validateUsername = (value: string) => {
    if (value.length === 0) {
      setUsernameValid(null);
    } else if (value.length >= 1) {
      setUsernameValid(true);
    } else {
      setUsernameValid(false);
    }
  };

  // 实时验证密码（仅检查是否非空）
  const validatePassword = (value: string) => {
    if (value.length === 0) {
      setPasswordValid(null);
    } else {
      setPasswordValid(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!username || !password) {
      setError("请输入用户名和密码");
      if (!username) setUsernameValid(false);
      if (!password) setPasswordValid(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        } as LoginRequest),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(
          "userSession",
          JSON.stringify({
            token: data.token,
            user: data.user,
          }),
        );
        navigate(Path.Chat);
      } else {
        setError(data.error || "登录失败");
        // 登录失败时添加抖动效果
        passwordInputRef.current?.focus();
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-container"]}>
        {/* Brand Section - Left Panel */}
        <div className={styles["brand-panel"]}>
          <div className={styles["brand-overlay"]} aria-hidden="true" />
          <div className={styles["brand-content"]}>
            <div className={styles["logo-wrapper"]}>
              <img src={typeof companyLogoPng === "string" ? companyLogoPng : companyLogoPng.src} alt="Company Logo" className={styles["company-logo"]} />
            </div>

            <div className={styles["brand-hero"]}>
              <p className={styles["brand-kicker"]}>ARCHITECT OF THE AI-ERA</p>
              <h1 className={styles["brand-heading"]}>AI 触手可及</h1>
              <p className={styles["brand-description"]}>
                AI 与人类的智慧共鸣，正迸发全新可能
              </p>
            </div>

            <div className={styles["brand-company"]}>
              {/* <h2 className={styles["brand-company-name"]}>
                晶铁半导体技术（广东）有限公司
              </h2> */}
              <p>
                <span className={styles["brand-company-label"]}>联系地址：</span>
                <span className={styles["brand-company-value"]}>深圳龙岗区星河双子塔西塔805B</span>
              </p>
              <p>
                <span className={styles["brand-company-label"]}>官方网站：</span>
                <span className={styles["brand-company-value"]}>www.ferrosemi.com</span>
              </p>
              <p>
                <span className={styles["brand-company-label"]}>咨询邮箱：</span>
                <span className={styles["brand-company-value"]}>info@ferrosemi.com</span>
              </p>
              <p>
                <span className={styles["brand-company-label"]}>联系电话：</span>
                <span className={styles["brand-company-value"]}>13802556048</span>
              </p>
            </div>
          </div>
          <div className={styles["brand-decoration"]} aria-hidden="true" />
        </div>

        {/* Form Section - Right Panel */}
        <div className={styles["form-panel"]}>
          <div className={styles["form-container"]}>
            <div className={styles["form-heading-group"]}>
              <h2 className={styles["form-title"]}>您好</h2>
              <p className={styles["form-subtitle"]}>欢迎使用晶铁普惠大模型一体机</p>
            </div>

            {error && (
              <div className={styles["error-message"]} role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles["login-form"]}>
              <div className={styles["form-field"]}>
                <label htmlFor="username" className={styles["field-label"]}>
                  用户名
                </label>
                <div className={`${styles["input-wrapper"]} ${usernameFocused ? styles["input-wrapper-focused"] : ""} ${usernameValid === true ? styles["input-wrapper-valid"] : ""} ${usernameValid === false ? styles["input-wrapper-invalid"] : ""}`}>
                  <input
                    ref={usernameInputRef}
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                      validateUsername(e.target.value);
                    }}
                    onFocus={() => setUsernameFocused(true)}
                    onBlur={() => setUsernameFocused(false)}
                    onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("请输入用户名")}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                    placeholder="请输入用户名"
                    className={styles["text-input"]}
                    required
                    autoComplete="username"
                    aria-required="true"
                    aria-describedby="username-hint"
                  />
                  {usernameValid === true && (
                    <span className={styles["input-icon"]} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z" fill="#10B981"/>
                      </svg>
                    </span>
                  )}
                  {usernameValid === false && (
                    <span className={styles["input-icon"]} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM9 6C9 5.44772 9.44772 5 10 5C10.5523 5 11 5.44772 11 6V10C11 10.5523 10.5523 11 10 11C9.44772 11 9 10.5523 9 10V6ZM9 14C9 13.4477 9.44772 13 10 13H10.01C10.5623 13 11.01 13.4477 11.01 14C11.01 14.5523 10.5623 15 10.01 15H10C9.44772 15 9 14.5523 9 14Z" fill="#EF4444"/>
                      </svg>
                    </span>
                  )}
                </div>
                {usernameValid === false && (
                  <p id="username-hint" className={styles["field-hint"]}>请输入用户名</p>
                )}
              </div>

              <div className={styles["form-field"]}>
                <label htmlFor="password" className={styles["field-label"]}>
                  密码
                </label>
                <div className={`${styles["input-wrapper"]} ${passwordFocused ? styles["input-wrapper-focused"] : ""} ${passwordValid === true ? styles["input-wrapper-valid"] : ""} ${passwordValid === false ? styles["input-wrapper-invalid"] : ""}`}>
                  <input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                      validatePassword(e.target.value);
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("请输入密码")}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                    placeholder="••••••••"
                    className={styles["text-input"]}
                    required
                    autoComplete="current-password"
                    aria-required="true"
                    aria-describedby="password-hint"
                  />
                  <button
                    type="button"
                    className={styles["password-toggle"]}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                  {passwordValid === false && (
                    <span className={styles["input-icon"]} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM9 6C9 5.44772 9.44772 5 10 5C10.5523 5 11 5.44772 11 6V10C11 10.5523 10.5523 11 10 11C9.44772 11 9 10.5523 9 10V6ZM9 14C9 13.4477 9.44772 13 10 13H10.01C10.5623 13 11.01 13.4477 11.01 14C11.01 14.5523 10.5623 15 10.01 15H10C9.44772 15 9 14.5523 9 14Z" fill="#EF4444"/>
                      </svg>
                    </span>
                  )}
                </div>
                {passwordValid === false && (
                  <p id="password-hint" className={styles["field-hint"]}>请输入密码</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles["login-button"]}
                aria-busy={loading}
              >
                {loading ? (
                  <span className={styles["button-loading"]}>
                    <svg className={styles["spinner"]} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className={styles["spinner-circle"]} cx="12" cy="12" r="10" fill="none" strokeWidth="3"/>
                    </svg>
                    <span>登录中</span>
                  </span>
                ) : "登录"}
              </button>
            </form>

            <div className={styles["form-footer"]}>
              <button type="button" className={styles["forgot-password-link"]}>
                忘记密码?
              </button>
            </div>

            <div className={styles["copyright"]}>
              <p>© 2026 晶铁半导体</p>
              <p>保留所有权利</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
