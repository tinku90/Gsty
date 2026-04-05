import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import {
  DEMO_EMAIL_OTP,
  clearPendingEmailOtp,
  createEmailOtpVerification,
  findUserByUsername,
  getPendingEmailOtp,
  getRegisteredUsers,
  getStoredUser,
  isAuthenticated,
  registerUser,
  resetUserPassword,
  storeUser,
  validateUserCredentials,
  verifyEmailOtp,
} from "../utils/auth";

const STEPS = [
  {
    title: "Upload sales and returns files",
    text: "Pick marketplace, B2B, or B2C reports and optionally attach returns data in the same flow.",
  },
  {
    title: "Review mapped transactions",
    text: "See sales and returns separately, fix any row quickly, and confirm your GST-ready dataset.",
  },
  {
    title: "File using guided GST tables",
    text: "Use structured GSTR views, filing guidance, and return-aware summaries to complete monthly filing faster.",
  },
];

function FeatureIcon({ children }) {
  return <span className="auth-feature__icon">{children}</span>;
}

export default function Login() {
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);
  const [mode, setMode] = useState("signin");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [signinForm, setSigninForm] = useState({
    username: storedUser?.username || "",
    password: "",
  });
  const [signupForm, setSignupForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    email: "",
    companyName: "",
    managerName: "",
  });
  const [otpStep, setOtpStep] = useState(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [forgotPasswordStep, setForgotPasswordStep] = useState("request");
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/upload");
    }
  }, [navigate]);

  const handleSignInRequest = () => {
    if (!signinForm.username.trim() || !signinForm.password) {
      setErrorMessage("Enter your username and password to continue.");
      return;
    }

    const result = validateUserCredentials(signinForm.username, signinForm.password);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    storeUser(result.user);
    setPendingUser(null);
    setOtpStep(null);
    setEmailOtp("");
    setStatusMessage("Signed in successfully. Redirecting you to uploads.");
    setErrorMessage("");
    navigate("/upload");
  };

  const handleForgotPasswordRequest = () => {
    if (!forgotPasswordForm.username.trim()) {
      setErrorMessage("Enter your username to reset your password.");
      return;
    }

    const matchedUser = findUserByUsername(forgotPasswordForm.username);
    if (!matchedUser) {
      setErrorMessage("We could not find that username.");
      return;
    }

    createEmailOtpVerification({
      mode: "forgot-password",
      username: matchedUser.username,
      email: matchedUser.email,
    });
    setPendingUser(matchedUser);
    setOtpStep("forgot-password");
    setForgotPasswordStep("verify");
    setEmailOtp("");
    setStatusMessage(`Password reset OTP sent to ${matchedUser.email}. Use demo OTP ${DEMO_EMAIL_OTP} for this MVP.`);
    setErrorMessage("");
  };

  const handleSignUpRequest = () => {
    const { username, password, confirmPassword, mobile, email, companyName, managerName } = signupForm;

    if (!username || !password || !confirmPassword || !mobile || !email || !companyName || !managerName) {
      setErrorMessage("Fill username, password, and all business details to continue.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Password and confirm password must match.");
      return;
    }

    const usernameExists = getRegisteredUsers().some(
      (user) => String(user.username || "").trim().toLowerCase() === username.trim().toLowerCase()
    );

    if (usernameExists) {
      setErrorMessage("That username is already taken. Please choose another one.");
      return;
    }

    createEmailOtpVerification({
      mode: "signup",
      username,
      email,
    });
    setPendingUser({
      username,
      password,
      mobile,
      email,
      companyName,
      managerName,
    });
    setOtpStep("signup");
    setEmailOtp("");
    setStatusMessage(`Email OTP sent to ${email}. Use demo OTP ${DEMO_EMAIL_OTP} for this MVP.`);
    setErrorMessage("");
  };

  const handleOtpVerification = () => {
    const result = verifyEmailOtp(emailOtp);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    const pending = getPendingEmailOtp();
    if (!pending || !pendingUser) {
      setErrorMessage("Verification session expired. Please start again.");
      return;
    }

    if (otpStep === "forgot-password") {
      clearPendingEmailOtp();
      setOtpStep(null);
      setEmailOtp("");
      setForgotPasswordStep("reset");
      setStatusMessage("Email verified. Set your new password below.");
      setErrorMessage("");
      return;
    }

    const signupResult = registerUser(pendingUser);
    if (!signupResult.ok) {
      setErrorMessage(signupResult.error);
      return;
    }

    clearPendingEmailOtp();
    setStatusMessage("Account created and email verified. Redirecting you to uploads.");
    setErrorMessage("");
    navigate("/upload");
  };

  const resetOtpStep = () => {
    clearPendingEmailOtp();
    if (otpStep === "forgot-password") {
      setMode("forgot-password");
      setForgotPasswordStep("request");
    }
    setOtpStep(null);
    setEmailOtp("");
    setPendingUser(otpStep === "forgot-password" ? pendingUser : null);
    setStatusMessage("");
    setErrorMessage("");
  };

  const resetForgotPasswordFlow = () => {
    clearPendingEmailOtp();
    setOtpStep(null);
    setPendingUser(null);
    setEmailOtp("");
    setForgotPasswordStep("request");
    setForgotPasswordForm({
      username: "",
      newPassword: "",
      confirmPassword: "",
    });
    setMode("signin");
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleForgotPasswordReset = () => {
    const { username, newPassword, confirmPassword } = forgotPasswordForm;

    if (!pendingUser?.username && !username.trim()) {
      setErrorMessage("Reset session expired. Start again.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password must match.");
      return;
    }

    const result = resetUserPassword(pendingUser?.username || username, newPassword);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setSigninForm({
      username: result.user.username,
      password: "",
    });
    setForgotPasswordForm({
      username: result.user.username,
      newPassword: "",
      confirmPassword: "",
    });
    setPendingUser(null);
    setOtpStep(null);
    setForgotPasswordStep("request");
    setStatusMessage("Password updated successfully. Sign in with your new password.");
    setErrorMessage("");
    setMode("signin");
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-hero__top">
          <div className="auth-brand">
            <strong>Gsty</strong>
          </div>
          <div className="auth-tag">Built for monthly GST workflow</div>
        </div>

        <div className="auth-hero__content">
          <div className="auth-copy">
            <p className="auth-eyebrow">Upload. Review. File.</p>
            <h1>GST filing that feels guided, not complicated.</h1>
            <p className="auth-lead">
              Upload sales and returns, review mapped transactions, and work through structured GSTR
              tables with a filing guide that keeps your team moving confidently.
            </p>

            <div className="auth-feature-grid">
              <article className="auth-feature auth-feature--mint">
                <FeatureIcon>01</FeatureIcon>
                <h3>Smart upload workflow</h3>
                <p>Marketplace, B2B, B2C, and returns uploads in one simple path.</p>
              </article>
              <article className="auth-feature auth-feature--gold">
                <FeatureIcon>02</FeatureIcon>
                <h3>Review before filing</h3>
                <p>Transactions stay easy to scan, edit, paginate, and validate.</p>
              </article>
              <article className="auth-feature auth-feature--blue">
                <FeatureIcon>03</FeatureIcon>
                <h3>GST-ready summaries</h3>
                <p>Structured tables for B2B, B2C, HSN, notes, exports, and documents issued.</p>
              </article>
            </div>

            <div className="auth-how">
              <h2>How it works</h2>
              <div className="auth-how__steps">
                {STEPS.map((step, index) => (
                  <div key={step.title} className="auth-step">
                    <div className="auth-step__number">0{index + 1}</div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-card__tabs">
              <button
                className={mode === "signin" ? "active" : ""}
                type="button"
                onClick={() => {
                  setMode("signin");
                  setOtpStep(null);
                  setStatusMessage("");
                  setErrorMessage("");
                }}
              >
                Sign In
              </button>
              <button
                className={mode === "signup" ? "active" : ""}
                type="button"
                onClick={() => {
                  setMode("signup");
                  setOtpStep(null);
                  setStatusMessage("");
                  setErrorMessage("");
                }}
              >
                Sign Up
              </button>
            </div>

            {mode === "signin" && !otpStep && (
              <div className="auth-form">
                <div>
                  <h2>Welcome back</h2>
                  <p>Use your portal username and password to sign in instantly.</p>
                </div>

                <label>
                  Username
                  <input
                    type="text"
                    value={signinForm.username}
                    onChange={(event) => setSigninForm((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="choose a unique username"
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    value={signinForm.password}
                    onChange={(event) => setSigninForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Enter your password"
                  />
                </label>

                <button
                  className="auth-link"
                  type="button"
                  onClick={() => {
                    setMode("forgot-password");
                    setOtpStep(null);
                    setPendingUser(null);
                    setEmailOtp("");
                    setForgotPasswordStep("request");
                    setForgotPasswordForm({
                      username: signinForm.username,
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setStatusMessage("");
                    setErrorMessage("");
                  }}
                >
                  Forgot password?
                </button>

                <button className="auth-submit" type="button" onClick={handleSignInRequest}>
                  Sign In
                </button>

                <div className="auth-helper">
                  This MVP uses local browser-based user management, so there are no SMS or email OTP costs.
                </div>
              </div>
            )}

            {mode === "forgot-password" && forgotPasswordStep === "request" && !otpStep && (
              <div className="auth-form">
                <div>
                  <h2>Reset your password</h2>
                  <p>Enter your username and we will verify your email before allowing a password reset.</p>
                </div>

                <label>
                  Username
                  <input
                    type="text"
                    value={forgotPasswordForm.username}
                    onChange={(event) =>
                      setForgotPasswordForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    placeholder="Enter your username"
                  />
                </label>

                <div className="auth-form__actions">
                  <button className="auth-secondary" type="button" onClick={resetForgotPasswordFlow}>
                    Back
                  </button>
                  <button className="auth-submit" type="button" onClick={handleForgotPasswordRequest}>
                    Send Email OTP
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && !otpStep && (
              <div className="auth-form">
                <div>
                  <h2>Create your workspace</h2>
                  <p>Create a unique portal username and password, then add your business details.</p>
                </div>

                <label>
                  Username
                  <input
                    type="text"
                    value={signupForm.username}
                    onChange={(event) => setSignupForm((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="unique portal username"
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Create a password"
                  />
                </label>

                <label>
                  Confirm Password
                  <input
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(event) =>
                      setSignupForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    placeholder="Re-enter your password"
                  />
                </label>

                <label>
                  Mobile Number
                  <input
                    type="tel"
                    value={signupForm.mobile}
                    onChange={(event) => setSignupForm((prev) => ({ ...prev, mobile: event.target.value }))}
                    placeholder="9876543210"
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) => setSignupForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="manager@company.com"
                  />
                </label>

                <label>
                  Company Name
                  <input
                    type="text"
                    value={signupForm.companyName}
                    onChange={(event) => setSignupForm((prev) => ({ ...prev, companyName: event.target.value }))}
                    placeholder="Aira Retail Private Limited"
                  />
                </label>

                <label>
                  Manager Name
                  <input
                    type="text"
                    value={signupForm.managerName}
                    onChange={(event) => setSignupForm((prev) => ({ ...prev, managerName: event.target.value }))}
                    placeholder="Riya Sharma"
                  />
                </label>

                <button className="auth-submit" type="button" onClick={handleSignUpRequest}>
                  Create Account and Send Email OTP
                </button>

                <div className="auth-helper">
                  To keep costs at zero right now, this MVP stores users locally in the browser instead of using paid OTP services.
                </div>
              </div>
            )}

            {otpStep && (
              <div className="auth-form">
                <div>
                  <h2>Verify your email</h2>
                  <p>
                    We sent an email verification code before continuing.
                    <span className="auth-demo-note"> Demo email OTP for this MVP: {DEMO_EMAIL_OTP}</span>
                  </p>
                </div>

                <label>
                  Email OTP
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(event) => setEmailOtp(event.target.value)}
                    placeholder="Enter email OTP"
                  />
                </label>

                <div className="auth-form__actions">
                  <button className="auth-secondary" type="button" onClick={resetOtpStep}>
                    Back
                  </button>
                  <button className="auth-submit" type="button" onClick={handleOtpVerification}>
                    Verify Email
                  </button>
                </div>
              </div>
            )}

            {mode === "forgot-password" && forgotPasswordStep === "reset" && !otpStep && (
              <div className="auth-form">
                <div>
                  <h2>Choose a new password</h2>
                  <p>Your email is verified. Set a new password for your portal account.</p>
                </div>

                <label>
                  New Password
                  <input
                    type="password"
                    value={forgotPasswordForm.newPassword}
                    onChange={(event) =>
                      setForgotPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                    }
                    placeholder="Enter your new password"
                  />
                </label>

                <label>
                  Confirm New Password
                  <input
                    type="password"
                    value={forgotPasswordForm.confirmPassword}
                    onChange={(event) =>
                      setForgotPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    placeholder="Re-enter your new password"
                  />
                </label>

                <div className="auth-form__actions">
                  <button className="auth-secondary" type="button" onClick={resetForgotPasswordFlow}>
                    Cancel
                  </button>
                  <button className="auth-submit" type="button" onClick={handleForgotPasswordReset}>
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {statusMessage ? <div className="auth-message auth-message--success">{statusMessage}</div> : null}
            {errorMessage ? <div className="auth-message auth-message--error">{errorMessage}</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
