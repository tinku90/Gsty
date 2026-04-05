import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../services/api";
import "./Dashboard.css";

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function normalizeActivity(raw) {
  if (!raw?.length) return [];
  return raw.map((a) =>
    typeof a === "string" ? { text: a, time: "" } : { text: a.text || "", time: a.time || "" }
  );
}

function normalizeUpcoming(raw) {
  if (!raw?.length) return [];
  return raw.map((u) => ({
    type: u.type,
    period: u.period || "",
    dueDate: u.dueDate || u.date || "",
    status: (u.status || "pending").toLowerCase(),
  }));
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      console.error("API ERROR:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Could not load dashboard.";
      setError(msg);
    }
  };

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <p className="hint">
          Start the API from the project root so it listens on port 5000 and exposes{" "}
          <code>/api/dashboard</code>. With the CRA dev server, requests are proxied from the UI.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-skeleton" style={{ height: 72, width: "100%", maxWidth: 480, marginBottom: 24 }} />
        <div className="dashboard-stats dashboard-stats--loading">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dashboard-skeleton" style={{ height: 120, borderRadius: 16 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="dashboard-skeleton" style={{ height: 280, borderRadius: 16 }} />
          <div className="dashboard-skeleton" style={{ height: 280, borderRadius: 16 }} />
        </div>
        <div className="dashboard-skeleton" style={{ height: 200, marginTop: 20, borderRadius: 16 }} />
      </div>
    );
  }

  const userName = data.userName || "John Accountant";
  const upcoming = normalizeUpcoming(data.upcoming);
  const activity = normalizeActivity(data.activity);
  const attentionClients = data.attentionClients || [];

  const stats = [
    {
      label: "Total Clients",
      value: data.totalClients,
      hint: data.totalClientsHint || "Active in workspace",
      icon: <IconUsers />,
      tone: "indigo",
    },
    {
      label: "Returns Filed",
      value: data.returnsFiled,
      hint: data.returnsFiledHint || "This period",
      icon: <IconDocument />,
      tone: "emerald",
    },
    {
      label: "Pending Filings",
      value: data.pending,
      hint: data.pendingHint || "Needs attention",
      icon: <IconClock />,
      tone: "amber",
    },
    {
      label: "Alerts",
      value: data.alerts,
      hint: data.alertsHint || "Review items",
      icon: <IconAlertTriangle />,
      tone: "rose",
    },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-welcome">Welcome back, {userName}!</h1>
        <p className="dashboard-subtitle">Manage your clients&apos; GST compliance.</p>
      </header>

      <section className="dashboard-stats" aria-label="Summary statistics">
        {stats.map((s) => (
          <article key={s.label} className="dashboard-stat">
            <div className={`dashboard-stat-icon dashboard-stat-icon--corner dashboard-stat-icon--${s.tone}`}>
              {s.icon}
            </div>
            <p className="dashboard-stat-label">{s.label}</p>
            <p className="dashboard-stat-value">{s.value}</p>
            <p className="dashboard-stat-hint">{s.hint}</p>
          </article>
        ))}
      </section>

      <div className="dashboard-panels">
        <section className="dashboard-panel" aria-labelledby="deadlines-heading">
          <div className="dashboard-panel-head">
            <h3 id="deadlines-heading">Upcoming Deadlines</h3>
          </div>
          <div className="dashboard-panel-body">
            {upcoming.map((item, i) => (
              <div key={i} className="dashboard-row">
                <div>
                  <p className="dashboard-row-title">{item.type}</p>
                  <p className="dashboard-row-meta">
                    {item.period}
                    {item.period && item.dueDate ? " · " : ""}
                    {item.dueDate ? `Due ${item.dueDate}` : ""}
                  </p>
                </div>
                <span
                  className={`dashboard-badge ${
                    item.status === "pending"
                      ? "dashboard-badge--pending"
                      : item.status === "upcoming"
                        ? "dashboard-badge--upcoming"
                        : "dashboard-badge--done"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel" aria-labelledby="activity-heading">
          <div className="dashboard-panel-head">
            <h3 id="activity-heading">Recent Activity</h3>
          </div>
          <div className="dashboard-panel-body">
            {activity.map((a, i) => (
              <div key={i} className="dashboard-activity-item">
                <span className="dashboard-activity-dot" aria-hidden />
                <div className="dashboard-activity-text">
                  <span>{a.text}</span>
                  {a.time ? <span className="dashboard-activity-time">{a.time}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {attentionClients.length > 0 && (
        <section className="dashboard-panel dashboard-attention" aria-labelledby="attention-heading">
          <div className="dashboard-panel-head">
            <h3 id="attention-heading">Clients Requiring Attention</h3>
          </div>
          <div className="dashboard-attention-body">
            {attentionClients.map((c, i) => (
              <div key={i} className="dashboard-attention-row">
                <div>
                  <p className="dashboard-attention-name">{c.name}</p>
                  <p className="dashboard-attention-gstin">GSTIN: {c.gstin}</p>
                </div>
                <div className="dashboard-attention-actions">
                  <span className="dashboard-badge dashboard-badge--pending">{c.pending} Pending</span>
                  <Link to="/clients" className="dashboard-view-link">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
