import { useEffect, useState } from "react";
import {
  clientLogin,
  getClientProfile,
  getClientUsers,
  getClientLoginLogs,
  updateClientUserStatus,
} from "./api";
import "./App.css";

const TOKEN_KEY = "universal_tv_client_token";

export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) || ""
  );
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loginLogsLoading, setLoginLogsLoading] = useState(false);
  const [loginLogsError, setLoginLogsError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    getClientProfile(token)
      .then((data) => setProfile(data))
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await clientLogin(email.trim(), password);
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setProfile(data.client);
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setProfile(null);
    setEmail("");
    setPassword("");
    setError("");
    setPage("dashboard");
    setUsers([]);
  }

  async function openUsers() {
    setPage("users");
    setUsersLoading(true);
    setUsersError("");

    try {
      const data = await getClientUsers(token);
      setUsers(data);
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }

  async function openLoginLogs() {
    setPage("login-logs");
    setLoginLogsLoading(true);
    setLoginLogsError("");

    try {
      const data = await getClientLoginLogs(token);
      setLoginLogs(data);
    } catch (err) {
      setLoginLogsError(err.message);
    } finally {
      setLoginLogsLoading(false);
    }
  }
  async function handleUserStatus(user) {
    setUpdatingUserId(user.id);
    setUsersError("");

    try {
      const updated = await updateClientUserStatus(
        token,
        user.id,
        !user.is_active
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading && !profile) {
    return (
      <main className="center-screen">
        <div className="panel-card">
          <h2>Loading Client Panel...</h2>
        </div>
      </main>
    );
  }

  if (!token || !profile) {
    return (
      <main className="center-screen">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="brand-mark">TV</div>
          <h1>Client Panel</h1>
          <p className="muted">
            Sign in to manage your Universal TV application.
          </p>

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="client@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
          />

          {error && <div className="error-box">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">Universal TV</div>
          <div className="tenant-name">
            {profile.tenant_name || "Client Panel"}
          </div>
        </div>

        <nav>
          <button
            className={page === "dashboard" ? "nav-active" : ""}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={page === "users" ? "nav-active" : ""}
            onClick={openUsers}
          >
            Users
          </button>

          <button
            className={page === "login-logs" ? "nav-active" : ""}
            onClick={openLoginLogs}
          >
            Login Logs
          </button>
          <button disabled>Live Users</button>
          <button disabled>Advertisements</button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      <main className="dashboard">
        {page === "dashboard" && (
          <>
            <header className="dashboard-header">
              <div>
                <h1>Dashboard</h1>
                <p>
                  Welcome, {profile.name}. This panel is restricted to your tenant.
                </p>
              </div>

              <span className="status-badge">
                {profile.is_active ? "Panel Active" : "Panel Blocked"}
              </span>
            </header>

            <section className="dashboard-grid">
              <article className="stat-card">
                <span>Tenant</span>
                <strong>{profile.tenant_name}</strong>
              </article>

              <article className="stat-card">
                <span>Account</span>
                <strong>{profile.email}</strong>
              </article>

              <article className="stat-card">
                <span>App Status</span>
                <strong>
                  {profile.tenant_is_active ? "Active" : "Inactive"}
                </strong>
              </article>

              <article className="stat-card">
                <span>Last Login</span>
                <strong>
                  {profile.last_login_at
                    ? new Date(profile.last_login_at).toLocaleString()
                    : "Current session"}
                </strong>
              </article>
            </section>

            <section className="content-card">
              <h2>Client Panel</h2>
              <p>
                Manage your application users from the Users section.
                Login logs, live users and advertisements will be connected next.
              </p>
            </section>
          </>
        )}

        {page === "users" && (
          <>
            <header className="dashboard-header">
              <div>
                <h1>App Users</h1>
                <p>
                  Manage users registered with {profile.tenant_name}.
                </p>
              </div>

              <span className="status-badge">
                {users.length} Users
              </span>
            </header>

            {usersError && (
              <div className="error-box">{usersError}</div>
            )}

            <section className="content-card">
              {usersLoading ? (
                <p>Loading users...</p>
              ) : users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <div className="users-table-wrap">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>Last Login</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name || "-"}</td>
                          <td>{user.mobile_number || "-"}</td>
                          <td>{user.email || "-"}</td>
                          <td>
                            {user.last_login_at
                              ? new Date(user.last_login_at).toLocaleString()
                              : "Never"}
                          </td>
                          <td>
                            <span
                              className={
                                user.is_active
                                  ? "user-status active"
                                  : "user-status blocked"
                              }
                            >
                              {user.is_active ? "Active" : "Blocked"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={
                                user.is_active
                                  ? "user-action danger"
                                  : "user-action success"
                              }
                              disabled={updatingUserId === user.id}
                              onClick={() => handleUserStatus(user)}
                            >
                              {updatingUserId === user.id
                                ? "Updating..."
                                : user.is_active
                                  ? "Block"
                                  : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
        {page === "login-logs" && (
          <>
            <header className="dashboard-header">
              <div>
                <h1>Login Logs</h1>
                <p>Recent app user logins for {profile.tenant_name}.</p>
              </div>

              <span className="status-badge">
                {loginLogs.length} Logins
              </span>
            </header>

            {loginLogsError && (
              <div className="error-box">{loginLogsError}</div>
            )}

            <section className="content-card">
              {loginLogsLoading ? (
                <p>Loading login logs...</p>
              ) : loginLogs.length === 0 ? (
                <p>No login logs found.</p>
              ) : (
                <div className="users-table-wrap">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Login Time</th>
                        <th>User</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>IP Address</th>
                        <th>Device / Browser</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            {log.logged_in_at
                              ? new Date(log.logged_in_at).toLocaleString()
                              : "-"}
                          </td>
                          <td>{log.name || "-"}</td>
                          <td>{log.mobile_number || "-"}</td>
                          <td>{log.email || "-"}</td>
                          <td>{log.ip_address || "-"}</td>
                          <td>{log.user_agent || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
