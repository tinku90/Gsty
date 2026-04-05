import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "28px 32px",
          background: "#f5f7fb",
          minHeight: "100vh",
          overflow: "auto",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}