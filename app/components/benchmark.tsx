"use client";

import React, { useState, useEffect } from "react";
import styles from "./benchmark.module.scss";

interface FormData {
  dataset: "random" | "sharegpt";
  inputLen: number;
  outputLen: number;
  numPrompts: number;
  seed: number;
}

export function Benchmark() {
  const [formData, setFormData] = useState<FormData>({
    dataset: "random",
    inputLen: 256,
    outputLen: 256,
    numPrompts: 1,
    seed: 1,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [currentModel, setCurrentModel] = useState<string>("");
  const [modelSize, setModelSize] = useState<number>(32768); // 默认 32k

  // 从模型名中提取大小
  const extractModelSize = (modelName: string): number => {
    // 匹配模型名末尾的 -数字K 格式
    const match = modelName.match(/-([0-9]+)K$/);
    if (match && match[1]) {
      const sizeInK = parseInt(match[1]);
      return sizeInK * 1024; // 转换为字节
    }
    return 32768; // 默认 32k
  };

  // 获取当前模型信息
  useEffect(() => {
    const fetchCurrentModel = async () => {
      try {
        const response = await fetch("/api/model/current", {
          cache: "no-store",
        });
        const data = await response.json();
        if (data.config) {
          const modelName = data.config.replace(".yaml", "");
          setCurrentModel(modelName);
          const size = extractModelSize(modelName);
          setModelSize(size);
        }
      } catch (error) {
        console.error("Failed to fetch current model:", error);
      }
    };

    fetchCurrentModel();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? parseInt(value) || 0 : value;

    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        [name]: newValue,
      };

      // 检查输入长度和输出长度的和是否超过模型大小
      if (updatedForm.dataset === "random") {
        const totalLen = updatedForm.inputLen + updatedForm.outputLen;
        if (totalLen > modelSize) {
          alert(
            `输入长度和输出长度的和 (${totalLen}) 超过了当前模型大小 (${modelSize})！`,
          );
        }
      }

      return updatedForm;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setOutput("");

    try {
      const response = await fetch("/api/benchmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to start benchmark");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder("utf-8").decode(value);
        setOutput((prev) => prev + text);
      }
    } catch (error) {
      setOutput((prev) => prev + `Error: ${(error as Error).message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>大模型基准测试</h1>

      {/* 当前模型信息 */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>
          当前模型
        </p>
        <p
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#0f172a",
            margin: 0,
          }}
        >
          {currentModel || "加载中..."}
        </p>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "8px 0 0 0" }}>
          模型大小: {modelSize / 1024}K ({modelSize} tokens)
        </p>
      </div>

      <div className={styles.content}>
        {/* 输入区域 */}
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>数据集选择</label>
                <select
                  name="dataset"
                  value={formData.dataset}
                  onChange={handleInputChange}
                  className={styles.select}
                  disabled={isRunning}
                >
                  <option value="random">Random (随机)</option>
                  <option value="sharegpt">ShareGPT (真实对话)</option>
                </select>
              </div>

              {formData.dataset === "random" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>输入长度</label>
                    <input
                      type="number"
                      name="inputLen"
                      value={formData.inputLen}
                      onChange={handleInputChange}
                      min={1}
                      max={32768}
                      className={styles.input}
                      disabled={isRunning}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>输出长度</label>
                    <input
                      type="number"
                      name="outputLen"
                      value={formData.outputLen}
                      onChange={handleInputChange}
                      min={1}
                      max={32768}
                      className={styles.input}
                      disabled={isRunning}
                    />
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>总任务数</label>
                <input
                  type="number"
                  name="numPrompts"
                  value={formData.numPrompts}
                  onChange={handleInputChange}
                  min={1}
                  max={20}
                  className={styles.input}
                  disabled={isRunning}
                />
              </div>

              {formData.dataset === "sharegpt" && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>随机种子</label>
                  <input
                    type="number"
                    name="seed"
                    value={formData.seed}
                    onChange={handleInputChange}
                    className={styles.input}
                    disabled={isRunning}
                  />
                </div>
              )}

              <div className={styles.formButton}>
                <button
                  type="submit"
                  className={styles.button}
                  disabled={isRunning}
                >
                  {isRunning ? "测试进行中..." : "启动测试"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 输出区域 */}
        <div className={styles.terminalContainer}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalTitle}>测试输出</div>
          </div>
          <div className={styles.terminal}>
            <pre className={styles.terminalOutput}>
              {output || "等待测试启动..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
