import axios from "axios";

// Dev: leave unset and use package.json "proxy" → requests go to /api on :3000 and forward to :5000.
// Prod: set REACT_APP_API_URL to the API host only, e.g. http://localhost:5000 or https://api.example.com
const envBase = (process.env.REACT_APP_API_URL || "").trim();
const API = axios.create({
  baseURL: envBase ? `${envBase.replace(/\/$/, "")}/api` : "/api",
});

export default API;

export const getDashboard = () => API.get("/dashboard");
