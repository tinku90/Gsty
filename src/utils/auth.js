const AUTH_KEY = "gstyAuthUser";
const USERS_KEY = "gstyUsers";
const EMAIL_OTP_KEY = "gstyPendingEmailOtp";
const DEMO_EMAIL_OTP = "123456";

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function dispatchAuthChanged() {
  window.dispatchEvent(new Event("authStateChanged"));
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

export function getStoredUser() {
  return readJson(AUTH_KEY, null);
}

export function getRegisteredUsers() {
  return readJson(USERS_KEY, []);
}

export function findUserByUsername(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    return null;
  }

  return (
    getRegisteredUsers().find(
      (user) => normalizeUsername(user.username) === normalizedUsername
    ) || null
  );
}

export function isAuthenticated() {
  return Boolean(getStoredUser()?.isAuthenticated);
}

export function storeUser(user) {
  writeJson(AUTH_KEY, {
    ...user,
    isAuthenticated: true,
    updatedAt: new Date().toISOString(),
  });
  dispatchAuthChanged();
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_KEY);
  dispatchAuthChanged();
}

export function registerUser(user) {
  const users = getRegisteredUsers();
  const normalizedUsername = normalizeUsername(user.username);

  if (!normalizedUsername) {
    return { ok: false, error: "Username is required." };
  }

  const usernameExists = users.some(
    (existingUser) => normalizeUsername(existingUser.username) === normalizedUsername
  );

  if (usernameExists) {
    return { ok: false, error: "That username is already taken. Please choose another one." };
  }

  const nextUser = {
    username: normalizedUsername,
    password: String(user.password || ""),
    mobile: String(user.mobile || "").trim(),
    email: String(user.email || "").trim().toLowerCase(),
    companyName: String(user.companyName || "").trim(),
    managerName: String(user.managerName || "").trim(),
    createdAt: new Date().toISOString(),
  };

  writeJson(USERS_KEY, [...users, nextUser]);
  storeUser(nextUser);
  return { ok: true, user: nextUser };
}

export function validateUserCredentials(username, password) {
  const normalizedUsername = normalizeUsername(username);
  const matchedUser = getRegisteredUsers().find(
    (user) =>
      normalizeUsername(user.username) === normalizedUsername && user.password === String(password || "")
  );

  if (!matchedUser) {
    return { ok: false, error: "Invalid username or password." };
  }

  return { ok: true, user: matchedUser };
}

export function resetUserPassword(username, newPassword) {
  const normalizedUsername = normalizeUsername(username);
  const nextPassword = String(newPassword || "");

  if (!normalizedUsername) {
    return { ok: false, error: "Username is required." };
  }

  if (!nextPassword) {
    return { ok: false, error: "New password is required." };
  }

  const users = getRegisteredUsers();
  let updatedUser = null;

  const nextUsers = users.map((user) => {
    if (normalizeUsername(user.username) !== normalizedUsername) {
      return user;
    }

    updatedUser = {
      ...user,
      password: nextPassword,
      updatedAt: new Date().toISOString(),
    };
    return updatedUser;
  });

  if (!updatedUser) {
    return { ok: false, error: "User not found." };
  }

  writeJson(USERS_KEY, nextUsers);
  return { ok: true, user: updatedUser };
}

export function createEmailOtpVerification(payload) {
  const nextValue = {
    ...payload,
    otp: DEMO_EMAIL_OTP,
    createdAt: new Date().toISOString(),
  };
  writeJson(EMAIL_OTP_KEY, nextValue);
  return nextValue;
}

export function getPendingEmailOtp() {
  return readJson(EMAIL_OTP_KEY, null);
}

export function clearPendingEmailOtp() {
  localStorage.removeItem(EMAIL_OTP_KEY);
}

export function verifyEmailOtp(code) {
  const pending = getPendingEmailOtp();
  if (!pending) {
    return { ok: false, error: "OTP session expired. Please request a new OTP." };
  }

  if (String(code || "").trim() !== pending.otp) {
    return { ok: false, error: "Invalid OTP. Use the MVP demo OTP sent for email verification." };
  }

  return { ok: true, pending };
}

export function updateUserProfile(changes = {}) {
  const currentUser = getStoredUser();
  if (!currentUser?.username) {
    return { ok: false, error: "No authenticated user found." };
  }

  const users = getRegisteredUsers();
  const nextUsers = users.map((user) =>
    normalizeUsername(user.username) === normalizeUsername(currentUser.username)
      ? {
          ...user,
          ...changes,
          email: String(changes.email ?? user.email).trim().toLowerCase(),
          mobile: String(changes.mobile ?? user.mobile).trim(),
          companyName: String(changes.companyName ?? user.companyName).trim(),
          managerName: String(changes.managerName ?? user.managerName).trim(),
        }
      : user
  );

  const updatedUser = nextUsers.find(
    (user) => normalizeUsername(user.username) === normalizeUsername(currentUser.username)
  );

  writeJson(USERS_KEY, nextUsers);
  storeUser(updatedUser);
  return { ok: true, user: updatedUser };
}

export { DEMO_EMAIL_OTP };
