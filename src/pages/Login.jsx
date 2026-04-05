import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <line x1="9" y1="9" x2="9" y2="9.01" />
      <line x1="9" y1="12" x2="9" y2="12.01" />
      <line x1="9" y1="15" x2="9" y2="15.01" />
      <line x1="9" y1="18" x2="9" y2="18.01" />
    </svg>
  );
}

export default function Login() {
  const nav = useNavigate();
  const [role, setRole] = useState("accountant");

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-row">
            <span className="login-logo" aria-hidden>
              G
            </span>
            <span className="login-app-name">Gsty</span>
          </div>
          <p className="login-tagline">GST Returns Filing Made Simple</p>
        </div>

        <h1>Welcome Back</h1>
        <p className="login-sub">Sign in to your account</p>

        <p className="login-section-label">Select Your Role</p>
        <div className="login-roles">
          <label className="login-role">
            <input
              type="radio"
              name="role"
              checked={role === "accountant"}
              onChange={() => setRole("accountant")}
            />
            <span className="login-role-card">
              <span className="login-role-icon">
                <IconUser />
              </span>
              <strong>Accountant</strong>
              <span>Manage multiple clients</span>
            </span>
          </label>
          <label className="login-role">
            <input
              type="radio"
              name="role"
              checked={role === "company"}
              onChange={() => setRole("company")}
            />
            <span className="login-role-card">
              <span className="login-role-icon">
                <IconBuilding />
              </span>
              <strong>Company</strong>
              <span>Manage own GST</span>
            </span>
          </label>
        </div>

        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" placeholder="you@company.com" />
        </div>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" placeholder="••••••••" />
        </div>

        <button type="button" className="login-submit" onClick={() => nav("/dashboard")}>
          Sign In
        </button>

        <a className="login-forgot" href="#forgot" onClick={(e) => e.preventDefault()}>
          Forgot password?
        </a>
      </div>
    </div>
  );
}
