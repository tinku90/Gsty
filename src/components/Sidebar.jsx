import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";


function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    </svg>
  );
}

function IconLogOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 17 21 12 16 7" />
    </svg>
  );
}

const menu = [
  { name: "Upload Data", path: "/upload", Icon: IconUpload },
  { name: "Transactions", path: "/transactions", Icon: IconList },
  { name: "GST Returns", path: "/returns", Icon: IconFile },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [hasUploaded, setHasUploaded] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showGstReturns, setShowGstReturns] = useState(false);

  const getUploadState = () => {
    const uploadedSession = sessionStorage.getItem("hasUploaded");
    const reviewedSession = sessionStorage.getItem("hasReviewedData");
    const gstReturnsSession = sessionStorage.getItem("showGstReturns");

    const uploaded =
      uploadedSession !== null
        ? uploadedSession === "true"
        : localStorage.getItem("hasUploaded") === "true";
    const reviewed =
      reviewedSession !== null
        ? reviewedSession === "true"
        : localStorage.getItem("hasReviewedData") === "true";
    const gstReturns =
      gstReturnsSession !== null
        ? gstReturnsSession === "true"
        : localStorage.getItem("showGstReturns") === "true";

    return { uploaded, reviewed, gstReturns };
  };

  useEffect(() => {
    const { uploaded, reviewed, gstReturns } = getUploadState();
    setHasUploaded(uploaded);
    setHasReviewed(reviewed);
    setShowGstReturns(gstReturns);

    const handleUploadState = () => {
      const { uploaded: newUploaded, reviewed: newReviewed, gstReturns: newGstReturns } = getUploadState();
      setHasUploaded(newUploaded);
      setHasReviewed(newReviewed);
      setShowGstReturns(newGstReturns);
    };

    window.addEventListener("uploadStateChanged", handleUploadState);
    return () => window.removeEventListener("uploadStateChanged", handleUploadState);
  }, []);

  return (
    <aside className="sidebar">
      <Link to="/upload" className="sidebar-brand">
        <span className="sidebar-logo">G</span>
        <span className="sidebar-title">Gsty</span>
      </Link>

      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          <IconUsers />
        </div>
        <div className="sidebar-profile-text">
          <strong>John Accountant</strong>
          <span>Accountant</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menu.map(({ name, path, Icon }) => {
          // 🔥 hide Transactions until upload and review, hide GST Returns until GST button clicked
          if (name === "Transactions" && !(hasUploaded && hasReviewed)) return null;
          if (name === "GST Returns" && !(hasUploaded && hasReviewed && showGstReturns)) return null;

          const active = pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className={`sidebar-link${active ? " sidebar-link--active" : ""}`}
            >
              <Icon />
              {name}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={() => navigate("/")}>
          <IconLogOut />
          Logout
        </button>
      </div>
    </aside>
  );
}
