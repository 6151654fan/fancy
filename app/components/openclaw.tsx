"use client";

import React from "react";
import styles from "./openclaw.module.scss";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAppConfig } from "../store";
import ClawIcon from "../icons/claw.svg";
import ExternalLinkIcon from "../icons/share.svg";
import DownloadIcon from "../icons/download.svg";
import ArrowIcon from "../icons/arrow.svg";

const DEFAULT_OPENCLAW_URL = "http://localhost:18789/openclaw/";
const OPENCLAW_OFFICIAL_URL = "https://openclaw.ai";

function normalizeOpenclawUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_OPENCLAW_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export function OpenclawPage() {
  const navigate = useNavigate();
  const config = useAppConfig();

  const openLocalOpenclaw = () => {
    const targetUrl = normalizeOpenclawUrl(
      config.openclawConfig?.url ?? DEFAULT_OPENCLAW_URL,
    );
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const openOfficialSite = () => {
    window.open(OPENCLAW_OFFICIAL_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroIcon}>
          <div className={styles.heroIconInner}>
            <ClawIcon />
          </div>
        </div>
        <h1 className={styles.heroTitle}>OpenClaw</h1>
        <p className={styles.heroSubtitle}>
          开源的个人AI助手
        </p>
        <p className={styles.heroDesc}>
        OpenClaw是一个开放代理平台，运行在本地，可以从正在使用的聊天应用中运行。
        </p>
      </div>

      {/* CTA Section */}
      <div className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>将本地部署模型作为OpenClaw基座</h2>
          <p className={styles.ctaDesc}>
            已安装 Openclaw？直接打开本地服务，或访问官网了解更多
          </p>
          <div className={styles.ctaButtons}>
            <button
              className={styles.primaryBtn}
              onClick={openLocalOpenclaw}
              type="button"
            >
              <ExternalLinkIcon />
              <span>一键运行</span>
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={openOfficialSite}
              type="button"
            >
              <DownloadIcon />
              <span>立即安装</span>
            </button>
          </div>
          <div className={styles.ctaInfo}>
            <span className={styles.ctaLabel}>默认地址</span>
            <code className={styles.ctaUrl}>
              {config.openclawConfig?.url ?? DEFAULT_OPENCLAW_URL}
            </code>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(Path.Home)}
          type="button"
        >
          <ArrowIcon />
          <span>返回首页</span>
        </button>
      </div>
    </div>
  );
}
