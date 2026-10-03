import { useEffect, useState } from "react";
import { clientLogin, getClientProfile } from "./api";
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
          <button className="nav-active">Dashboard</button>
          <button disabled>Users</button>
          <button disabled>Login Logs</button>
          <button disabled>Live Users</button>
          <button disabled>Advertisements</button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      <main className="dashboard">
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
          <h2>Client Panel Ready</h2>
          <p>
            User management, login logs, live users and advertisements
            will be connected here in the next phases.
          </p>
        </section>
      </main>
    </div>
  );
}
