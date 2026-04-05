import { useMemo, useState } from "react";
import "./Settings.css";
import {
  DEMO_EMAIL_OTP,
  createEmailOtpVerification,
  getStoredUser,
  updateUserProfile,
  verifyEmailOtp,
} from "../utils/auth";

export default function Settings() {
  const currentUser = useMemo(() => getStoredUser(), []);
  const [form, setForm] = useState({
    username: currentUser?.username || "",
    managerName: currentUser?.managerName || "",
    companyName: currentUser?.companyName || "",
    mobile: currentUser?.mobile || "",
    email: currentUser?.email || "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerificationRequested, setEmailVerificationRequested] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  const originalEmail = currentUser?.email || "";
  const emailChanged = form.email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

  const requestEmailVerification = () => {
    if (!form.email.trim()) {
      setErrorMessage("Enter the new email address before requesting verification.");
      return;
    }

    createEmailOtpVerification({
      mode: "settings-email-change",
      username: form.username,
      email: form.email.trim().toLowerCase(),
    });
    setEmailVerificationRequested(true);
    setIsEmailVerified(false);
    setStatusMessage(`Verification code sent to ${form.email}. Use demo OTP ${DEMO_EMAIL_OTP} for this MVP.`);
    setErrorMessage("");
  };

  const verifyNewEmail = () => {
    const result = verifyEmailOtp(emailOtp);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setIsEmailVerified(true);
    setStatusMessage("New email verified successfully.");
    setErrorMessage("");
  };

  const saveChanges = () => {
    if (!form.managerName || !form.companyName || !form.mobile || !form.email) {
      setErrorMessage("Fill all profile fields before saving.");
      return;
    }

    if (emailChanged && !isEmailVerified) {
      setErrorMessage("Verify your new email address before saving changes.");
      return;
    }

    const result = updateUserProfile({
      managerName: form.managerName,
      companyName: form.companyName,
      mobile: form.mobile,
      email: form.email,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setStatusMessage("Profile updated successfully.");
    setErrorMessage("");
    setEmailVerificationRequested(false);
    setEmailOtp("");
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your workspace profile and contact details.</p>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card__intro">
          <h2>Profile Information</h2>
          <p>Keep your contact details up to date. Email changes require verification before they can be saved.</p>
        </div>

        <div className="settings-grid">
          <label>
            Username
            <input type="text" value={form.username} disabled />
          </label>

          <label>
            Manager Name
            <input
              type="text"
              value={form.managerName}
              onChange={(event) => setForm((prev) => ({ ...prev, managerName: event.target.value }))}
              placeholder="Enter manager name"
            />
          </label>

          <label>
            Company Name
            <input
              type="text"
              value={form.companyName}
              onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
              placeholder="Enter company name"
            />
          </label>

          <label>
            Mobile Number
            <input
              type="tel"
              value={form.mobile}
              onChange={(event) => setForm((prev) => ({ ...prev, mobile: event.target.value }))}
              placeholder="Enter mobile number"
            />
          </label>

          <label className="settings-grid__full">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => {
                const nextEmail = event.target.value;
                setForm((prev) => ({ ...prev, email: nextEmail }));
                setIsEmailVerified(nextEmail.trim().toLowerCase() === originalEmail.trim().toLowerCase());
                setEmailVerificationRequested(false);
                setEmailOtp("");
              }}
              placeholder="Enter email address"
            />
          </label>
        </div>

        {emailChanged && (
          <div className="settings-verify">
            <div className="settings-verify__content">
              <strong>Verify new email</strong>
              <p>Before saving, verify {form.email} to protect profile changes.</p>
            </div>
            <button className="settings-btn settings-btn--secondary" type="button" onClick={requestEmailVerification}>
              Send Email OTP
            </button>
          </div>
        )}

        {emailVerificationRequested && (
          <div className="settings-otp">
            <label>
              Email OTP
              <input
                type="text"
                value={emailOtp}
                onChange={(event) => setEmailOtp(event.target.value)}
                placeholder="Enter email OTP"
              />
            </label>
            <button className="settings-btn settings-btn--secondary" type="button" onClick={verifyNewEmail}>
              Verify Email
            </button>
            <span className="settings-otp__hint">Demo OTP for this MVP: {DEMO_EMAIL_OTP}</span>
          </div>
        )}

        <div className="settings-actions">
          <button className="settings-btn" type="button" onClick={saveChanges}>
            Save Changes
          </button>
        </div>

        {statusMessage ? <div className="settings-message settings-message--success">{statusMessage}</div> : null}
        {errorMessage ? <div className="settings-message settings-message--error">{errorMessage}</div> : null}
      </div>
    </div>
  );
}
