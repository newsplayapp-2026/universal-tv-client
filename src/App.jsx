import { useEffect, useState } from "react";
import {
  clientLogin,
  getClientProfile,
  getClientUsers,
  getClientLoginLogs,
  getClientLiveUsers,
  getClientAds,
  createClientAd,
  updateClientAd,
  deleteClientAd,
  uploadClientAdMedia,
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
  const [liveUsers, setLiveUsers] = useState([]);
  const [liveUsersLoading, setLiveUsersLoading] = useState(false);
  const [liveUsersError, setLiveUsersError] = useState("");
  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState("");
  const [editingAd, setEditingAd] = useState(null);
  const [savingAd, setSavingAd] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deletingAdId, setDeletingAdId] = useState(null);
  const [adForm, setAdForm] = useState({
    name: "",
    mediaType: "IMAGE",
    mediaUrl: "",
    placement: "FULLSCREEN",
    targetDevice: "BOTH",
    durationSeconds: 10,
    repeatIntervalSeconds: 60,
    isActive: true,
    skippable: false,
    skipAfterSeconds: 0,
    closable: true,
  });

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

  useEffect(() => {
    if (page !== "live-users" || !token) {
      return;
    }

    const liveUsersInterval = setInterval(async () => {
      try {
        const data = await getClientLiveUsers(token);
        setLiveUsers(data.users || []);
        setLiveUsersError("");
      } catch (err) {
        setLiveUsersError(err.message);
      }
    }, 15_000);

    return () => clearInterval(liveUsersInterval);
  }, [page, token]);
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
  async function openLiveUsers() {
    setPage("live-users");
    setLiveUsersLoading(true);
    setLiveUsersError("");

    try {
      const data = await getClientLiveUsers(token);
      setLiveUsers(data.users || []);
    } catch (err) {
      setLiveUsersError(err.message);
    } finally {
      setLiveUsersLoading(false);
    }
  }
  async function openAdvertisements() {
    setPage("advertisements");
    setAdsLoading(true);
    setAdsError("");

    try {
      const data = await getClientAds(token);
      setAds(Array.isArray(data) ? data : []);
    } catch (err) {
      setAdsError(err.message);
    } finally {
      setAdsLoading(false);
    }
  }
  async function handleAdMediaUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    setAdsError("");

    try {
      const data = await uploadClientAdMedia(token, file);
      setAdForm((current) => ({
        ...current,
        mediaUrl: data.url,
        mediaType: data.mediaType || current.mediaType,
      }));
    } catch (err) {
      setAdsError(err.message);
    } finally {
      setUploadingMedia(false);
      event.target.value = "";
    }
  }
  function handleAdFormChange(event) {
    const { name, value, type, checked } = event.target;
    setAdForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetAdForm() {
    setEditingAd(null);
    setAdForm({
      name: "",
      mediaType: "IMAGE",
      mediaUrl: "",
      placement: "FULLSCREEN",
      targetDevice: "BOTH",
      durationSeconds: 10,
      repeatIntervalSeconds: 60,
      isActive: true,
      skippable: false,
      skipAfterSeconds: 0,
      closable: true,
    });
  }

  async function handleSaveAd(event) {
    event.preventDefault();
    setSavingAd(true);
    setAdsError("");

    const payload = {
      ...adForm,
      durationSeconds: Number(adForm.durationSeconds) || 10,
      repeatIntervalSeconds: Number(adForm.repeatIntervalSeconds) || 60,
      skipAfterSeconds: Number(adForm.skipAfterSeconds) || 0,
    };

    try {
      if (editingAd) {
        await updateClientAd(token, editingAd.id, payload);
      } else {
        await createClientAd(token, payload);
      }

      resetAdForm();
      const data = await getClientAds(token);
      setAds(Array.isArray(data) ? data : []);
    } catch (err) {
      setAdsError(err.message);
    } finally {
      setSavingAd(false);
    }
  }

  function handleEditAd(ad) {
    setEditingAd(ad);
    setAdsError("");
    setAdForm({
      name: ad.name || "",
      mediaType: ad.media_type || "IMAGE",
      mediaUrl: ad.media_url || "",
      placement: ad.placement || "FULLSCREEN",
      targetDevice: ad.target_device || "BOTH",
      durationSeconds: ad.duration_seconds || 10,
      repeatIntervalSeconds: ad.repeat_interval_seconds || 60,
      isActive: ad.is_active !== false,
      skippable: Boolean(ad.skippable),
      skipAfterSeconds: ad.skip_after_seconds || 0,
      closable: ad.closable !== false,
    });
  }

  async function handleDeleteAd(ad) {
    if (!window.confirm(`Delete advertisement "${ad.name}"?`)) return;

    setDeletingAdId(ad.id);
    setAdsError("");

    try {
      await deleteClientAd(token, ad.id);
      setAds((current) => current.filter((item) => item.id !== ad.id));
      if (editingAd?.id === ad.id) resetAdForm();
    } catch (err) {
      setAdsError(err.message);
    } finally {
      setDeletingAdId(null);
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
          <button
            className={page === "live-users" ? "nav-active" : ""}
            onClick={openLiveUsers}
          >
            Live Users
          </button>
          <button
            className={page === "advertisements" ? "nav-active" : ""}
            onClick={openAdvertisements}
          >
            Advertisements
          </button>
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
        {page === "live-users" && (
          <>
            <header className="dashboard-header">
              <div>
                <h1>Live Users</h1>
                <p>Users currently active in {profile.tenant_name}.</p>
              </div>

              <span className="status-badge">
                {liveUsers.length} Online
              </span>
            </header>

            {liveUsersError && (
              <div className="error-box">{liveUsersError}</div>
            )}

            <section className="content-card">
              {liveUsersLoading ? (
                <p>Loading live users...</p>
              ) : liveUsers.length === 0 ? (
                <p>No users are currently online.</p>
              ) : (
                <div className="users-table-wrap">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>Last Seen</th>
                        <th>Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name || "-"}</td>
                          <td>{user.mobile_number || "-"}</td>
                          <td>{user.email || "-"}</td>
                          <td>
                            {user.last_seen_at
                              ? new Date(user.last_seen_at).toLocaleString()
                              : "-"}
                          </td>
                          <td>
                            {user.last_login_at
                              ? new Date(user.last_login_at).toLocaleString()
                              : "Never"}
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
        {page === "advertisements" && (
          <>
            <header className="dashboard-header">
              <div>
                <h1>Advertisements</h1>
                <p>Manage advertisements for {profile.tenant_name}.</p>
              </div>
              <span className="status-badge">{ads.length} Ads</span>
            </header>

            {adsError && <div className="error-box">{adsError}</div>}

            <section className="content-card">
              <h2>{editingAd ? "Edit Advertisement" : "Create Advertisement"}</h2>

              <form onSubmit={handleSaveAd}>
                <div className="form-grid">
                  <label>
                    Ad Name
                    <input name="name" value={adForm.name} onChange={handleAdFormChange} required />
                  </label>

                  <label>
                    Image / Video
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                      onChange={handleAdMediaUpload}
                      disabled={uploadingMedia}
                    />
                    <small>
                      {uploadingMedia
                        ? "Uploading..."
                        : adForm.mediaUrl
                          ? `${adForm.mediaType} uploaded`
                          : "Upload advertisement media"}
                    </small>
                  </label>

                  <label>
                    Placement
                    <select name="placement" value={adForm.placement} onChange={handleAdFormChange}>
                      <option value="FULLSCREEN">Fullscreen</option>
                      <option value="TOP">Top</option>
                      <option value="BOTTOM">Bottom</option>
                    </select>
                  </label>

                  <label>
                    Device
                    <select name="targetDevice" value={adForm.targetDevice} onChange={handleAdFormChange}>
                      <option value="BOTH">Mobile + TV</option>
                      <option value="MOBILE">Mobile</option>
                      <option value="TV">TV</option>
                    </select>
                  </label>

                  <label>
                    Duration (seconds)
                    <input
                      type="number"
                      min="1"
                      name="durationSeconds"
                      value={adForm.durationSeconds}
                      onChange={handleAdFormChange}
                    />
                  </label>
                </div>

                <div className="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={adForm.isActive}
                      onChange={handleAdFormChange}
                    />
                    Active
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={savingAd || uploadingMedia || !adForm.mediaUrl}>
                    {savingAd ? "Saving..." : editingAd ? "Update Advertisement" : "Create Advertisement"}
                  </button>

                  {editingAd && (
                    <button type="button" onClick={resetAdForm}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </section>

            <section className="content-card">
              <h2>Existing Advertisements</h2>

              {adsLoading ? (
                <p>Loading advertisements...</p>
              ) : ads.length === 0 ? (
                <p>No advertisements found.</p>
              ) : (
                <div className="users-table-wrap">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Placement</th>
                        <th>Device</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ads.map((ad) => (
                        <tr key={ad.id}>
                          <td>{ad.name}</td>
                          <td>{ad.media_type}</td>
                          <td>{ad.placement}</td>
                          <td>{ad.target_device}</td>
                          <td>{ad.is_active ? "Active" : "Inactive"}</td>
                          <td>
                            <button type="button" onClick={() => handleEditAd(ad)}>Edit</button>{" "}
                            <button
                              type="button"
                              disabled={deletingAdId === ad.id}
                              onClick={() => handleDeleteAd(ad)}
                            >
                              {deletingAdId === ad.id ? "Deleting..." : "Delete"}
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
      </main>
    </div>
  );
}








