import React, { useState, useEffect } from "react";
import styles from "./user-management.module.scss";
import { IconButton } from "./button";

interface User {
  id: string;
  username: string;
  password: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user" as "admin" | "user",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/login", {
        method: "GET",
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.error || "获取用户列表失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError("请输入用户名和密码");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const userSession = localStorage.getItem("userSession");
      const token = userSession ? JSON.parse(userSession).token : null;
      const response = await fetch("/api/login", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (data.success) {
        setShowAddForm(false);
        setNewUser({ username: "", password: "", role: "user" });
        fetchUsers();
      } else {
        setError(data.error || "添加用户失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("确定要删除这个用户吗？")) {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`/api/login?id=${userId}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          fetchUsers();
        } else {
          setError(data.error || "删除用户失败");
        }
      } catch (err) {
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className={styles["user-management"]}>
      <div className={styles["header"]}>
        <h2>用户管理</h2>
        <IconButton
          text="添加用户"
          type="primary"
          onClick={() => setShowAddForm(!showAddForm)}
        />
      </div>

      {error && <div className={styles["error"]}>{error}</div>}

      <div className={styles["user-list"]}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>密码</th>
              <th>角色</th>
              <th>创建人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.password}</td>
                <td>
                  <span
                    className={
                      user.role === "admin" ? styles["admin"] : styles["user"]
                    }
                  >
                    {user.role === "admin" ? "管理员" : "普通用户"}
                  </span>
                </td>
                <td>{user.createdBy || "系统"}</td>
                <td>
                  {user.id !== "1" && (
                    <span
                      className={styles["delete-button"]}
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={loading}
                    >
                      删除
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 模态弹窗 */}
      {showAddForm && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal-content"]}>
            <div className={styles["modal-header"]}>
              <h3>添加新用户</h3>
              <button
                className={styles["modal-close"]}
                onClick={() => {
                  setShowAddForm(false);
                  setNewUser({ username: "", password: "", role: "user" });
                }}
              >
                ×
              </button>
            </div>
            <div className={styles["modal-body"]}>
              <div className={styles["form-group"]}>
                <label>用户名</label>
                <input
                  type="text"
                  value={newUser.username}
                  placeholder="请输入用户名"
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      username: e.currentTarget.value.replace(
                        /[^a-zA-Z0-9]/g,
                        "",
                      ),
                    })
                  }
                  onKeyPress={(e) => {
                    // 只允许输入英文和数字
                    if (
                      !/[a-zA-Z0-9]/.test(e.key) &&
                      e.key !== "Backspace" &&
                      e.key !== "Delete"
                    ) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div className={styles["form-group"]}>
                <label>密码</label>
                <input
                  type="text"
                  value={newUser.password}
                  placeholder="请输入密码"
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      password: e.currentTarget.value.replace(
                        /[^a-zA-Z0-9]/g,
                        "",
                      ),
                    })
                  }
                  onKeyPress={(e) => {
                    // 只允许输入英文和数字
                    if (
                      !/[a-zA-Z0-9]/.test(e.key) &&
                      e.key !== "Backspace" &&
                      e.key !== "Delete"
                    ) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div className={styles["role-select"]}>
                <label>角色</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as "admin" | "user",
                    })
                  }
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>
            <div className={styles["modal-footer"]}>
              <IconButton
                text="取消"
                onClick={() => {
                  setShowAddForm(false);
                  setNewUser({ username: "", password: "", role: "user" });
                }}
              />
              <IconButton
                text="添加"
                type="primary"
                onClick={handleAddUser}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}