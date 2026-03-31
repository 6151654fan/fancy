"use client";

const GRAFANA_URL = "http://192.168.1.93:4000/?orgId=1&kiosk=true";

export function GrafanaPage() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <iframe
          src={GRAFANA_URL}
          title="Grafana Dashboard"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "var(--white)",
          }}
        />
      </div>
    </div>
  );
}
