import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { removeUploadedFile, resetUploadData } from "../services/api";
import "./UploadData.css";

function MarketplaceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5 4.5 5h15L21 9.5" />
      <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M9 14h6" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v14" />
      <path d="M14 20v-9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9" />
      <path d="M8 9h2M8 13h2M8 17h2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

export default function UploadData() {
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState("marketplace");
  const [marketplace, setMarketplace] = useState("amazon");
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const dispatchUploadState = () => {
    window.dispatchEvent(new Event("uploadStateChanged"));
  };

  const persistFiles = (fileList) => {
    try {
      sessionStorage.setItem("uploadedFiles", JSON.stringify(fileList));
      sessionStorage.setItem("hasUploaded", fileList.length > 0 ? "true" : "false");

      if (fileList.length === 0) {
        sessionStorage.setItem("hasReviewedData", "false");
        sessionStorage.setItem("showGstReturns", "false");
        localStorage.removeItem("hasUploaded");
        localStorage.removeItem("hasReviewedData");
        localStorage.removeItem("showGstReturns");
      }

      dispatchUploadState();
    } catch (error) {
      console.error("Unable to persist uploaded files in sessionStorage:", error);
    }
  };

  useEffect(() => {
    const savedFiles = sessionStorage.getItem("uploadedFiles");

    const clearStorage = () => {
      sessionStorage.removeItem("uploadedFiles");
      sessionStorage.setItem("hasUploaded", "false");
      sessionStorage.setItem("hasReviewedData", "false");
      sessionStorage.setItem("showGstReturns", "false");
      localStorage.removeItem("hasUploaded");
      localStorage.removeItem("hasReviewedData");
      localStorage.removeItem("showGstReturns");
      dispatchUploadState();
    };

    if (!savedFiles) {
      clearStorage();
      resetUploadData().catch((err) => console.error("Failed to reset backend data on load:", err));
      return;
    }

    try {
      const parsedFiles = JSON.parse(savedFiles);
      setFiles(parsedFiles);

      if (!parsedFiles.length) {
        clearStorage();
        resetUploadData().catch((err) => console.error("Failed to reset backend data on load:", err));
      }
    } catch (error) {
      console.error("Failed to parse saved uploaded files:", error);
      clearStorage();
      resetUploadData().catch((err) => console.error("Failed to reset backend data after parse error:", err));
    }
  }, []);

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (!selectedFiles.length) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("file", file);
      });

      formData.append("sourceType", sourceType);
      formData.append("marketplace", marketplace);

      const res = await API.post("/upload-excel", formData);
      const uploadedFiles = res.data?.files?.length
        ? res.data.files.map((file) => ({
            uploadId: file.uploadId,
            name: file.name,
            marketplace: file.marketplace || marketplace,
            sourceType: file.sourceType || sourceType,
            sourceLabel: file.sourceLabel || marketplace,
            status: "success",
            errors: 0,
          }))
        : selectedFiles.map((file) => ({
            name: file.name,
            marketplace,
            sourceType,
            sourceLabel: sourceType === "marketplace" ? marketplace : sourceType,
            status: "success",
            errors: 0,
          }));

      setFiles((prev) => {
        const updated = [...prev, ...uploadedFiles];
        persistFiles(updated);
        return updated;
      });

      setUploadStatus({
        success: true,
        summary: res.data || {},
      });

      setMessage("");
    } catch (err) {
      const failedFiles = selectedFiles.map((file) => ({
        name: file.name,
        marketplace,
        status: "error",
        errors: 1,
      }));

      setFiles((prev) => {
        const updated = [...prev, ...failedFiles];
        persistFiles(updated);
        return updated;
      });

      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }

    e.target.value = null;
  };

  const removeFile = async (index) => {
    const fileToRemove = files[index];

    try {
      if (fileToRemove?.uploadId) {
        await removeUploadedFile(fileToRemove.uploadId);
      } else if (files.length === 1) {
        await resetUploadData();
      }
    } catch (err) {
      console.error("Failed to remove backend data:", err);
    }

    setFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      persistFiles(updated);

      return updated;
    });
  };

  const totalFiles = files.length;
  const totalErrors = files.reduce((sum, file) => sum + (file.errors || 0), 0);

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1>Upload Your Sales Data</h1>
        <p>Choose your data source to prepare GST returns</p>
      </div>

      <div className="section source-section">
        <div className="source-cards">
          <div
            className={`card ${sourceType === "marketplace" ? "active" : ""}`}
            onClick={() => setSourceType("marketplace")}
          >
            <div className="card-icon primary">
              <MarketplaceIcon />
            </div>
            <h3>Marketplace Sales</h3>
            <p>Upload reports from Amazon, Flipkart, etc.</p>
          </div>

          <div
            className={`card ${sourceType === "b2b" ? "active" : ""}`}
            onClick={() => setSourceType("b2b")}
          >
            <div className="card-icon secondary">
              <BuildingIcon />
            </div>
            <h3>B2B Sales</h3>
            <p>GST invoices for registered customers</p>
          </div>

          <div
            className={`card ${sourceType === "b2c" ? "active" : ""}`}
            onClick={() => setSourceType("b2c")}
          >
            <div className="card-icon secondary">
              <UserIcon />
            </div>
            <h3>Direct Sales (B2C)</h3>
            <p>Retail / POS sales</p>
          </div>
        </div>
      </div>

      {sourceType === "marketplace" && (
        <div className="marketplace-section">
          <div className="marketplace-list">
            {[
              { id: "amazon", label: "Amazon", icon: "A", class: "amazon" },
              { id: "flipkart", label: "Flipkart", icon: "F", class: "flipkart" },
              { id: "meesho", label: "Meesho", icon: "M", class: "meesho" },
              { id: "myntra", label: "Myntra", icon: "M", class: "myntra" },
              { id: "nykaa", label: "Nykaa", icon: "N", class: "nykaa" },
              { id: "other", label: "Other", icon: "O", class: "other" },
            ].map((item) => (
              <div
                key={item.id}
                className={`marketplace-tile ${marketplace === item.id ? "active" : ""}`}
                onClick={() => setMarketplace(item.id)}
              >
                <div className={`marketplace-icon ${item.class}`}>{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section upload-section">
        <div className="upload-box">
          <div className="upload-icon">
            <UploadIcon />
          </div>
          <h3>Drag and drop your file here</h3>
          <p>or click to browse</p>

          <input
            type="file"
            multiple
            hidden
            id="fileUpload"
            onChange={handleFileUpload}
          />

          <button
            className="upload-btn"
            onClick={() => document.getElementById("fileUpload").click()}
          >
            Upload File
          </button>

          {loading && <p>Uploading...</p>}
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>Uploaded Files</h3>

          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-item">
              <span className="file-item-name">{file.name} ({file.marketplace})</span>
              <span className={`file-item-status ${file.status === "success" ? "success" : "error"}`}>
                {file.status === "success" ? "Processed" : "Error"}
              </span>
              <span className="file-item-errors">{file.errors > 0 ? `${file.errors} issues` : "No errors"}</span>
              <button className="secondary file-item-action" type="button" onClick={() => removeFile(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="upload-summary">
          <p>Total Files: {totalFiles}</p>
          <p>Errors: {totalErrors}</p>
        </div>
      )}

      {uploadStatus?.success && (
        <div className="upload-success">
          <div className="success-header">File uploaded successfully.</div>
        </div>
      )}

      {files.length > 0 && (
        <div className="upload-actions">
          <button
            className="primary"
            onClick={() => {
              sessionStorage.setItem("hasReviewedData", "true");
              dispatchUploadState();
              navigate("/transactions");
            }}
          >
            Review Data ->
          </button>
        </div>
      )}

      {message && <p className="upload-status">{message}</p>}
    </div>
  );
}
