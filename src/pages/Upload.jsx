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

const STATE_OPTIONS = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu" },
  { code: "26", name: "Dadra and Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
];

export default function UploadData() {
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState("marketplace");
  const [marketplace, setMarketplace] = useState("amazon");
  const [stateOfSale, setStateOfSale] = useState("");
  const [hasReturnsData, setHasReturnsData] = useState(false);
  const [selectedSalesFiles, setSelectedSalesFiles] = useState([]);
  const [selectedReturnFiles, setSelectedReturnFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const getErrorMessage = (error) => {
    const rawMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Upload failed.";

    if (typeof rawMessage === "string" && rawMessage.includes("Unexpected field")) {
      return "Upload failed because the backend is still using the older upload API. Please restart the backend server and try again.";
    }

    return rawMessage;
  };

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

  const uploadSelectedFiles = async () => {
    const hasExistingSalesUpload = files.some(
      (file) => file.status === "success" && file.uploadKind !== "returns"
    );
    const isReturnsOnlyUpload = hasReturnsData && selectedReturnFiles.length > 0 && selectedSalesFiles.length === 0;

    if (!stateOfSale) {
      setMessage("Please select the state of sale before uploading.");
      return;
    }

    if (!selectedSalesFiles.length && !hasExistingSalesUpload && !isReturnsOnlyUpload) {
      setMessage("Please select at least one sales file.");
      return;
    }

    if (hasReturnsData && !selectedReturnFiles.length) {
      setMessage("Please select the returns file as well.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      selectedSalesFiles.forEach((file) => {
        formData.append("file", file);
      });
      selectedReturnFiles.forEach((file) => {
        formData.append("returnsFile", file);
      });

      formData.append("sourceType", sourceType);
      formData.append("marketplace", marketplace);
      formData.append("stateOfSale", stateOfSale);

      const res = await API.post("/upload-excel", formData);
      const uploadedFiles = res.data?.files?.length
        ? res.data.files.map((file) => ({
            uploadId: file.uploadId,
            name: file.name,
            marketplace: file.marketplace || marketplace,
            sourceType: file.sourceType || sourceType,
            sourceLabel: file.sourceLabel || marketplace,
            uploadKind: file.uploadKind || "sales",
            status: "success",
            errors: 0,
          }))
        : [...selectedSalesFiles, ...selectedReturnFiles].map((file) => ({
            name: file.name,
            marketplace,
            sourceType,
            sourceLabel: sourceType === "marketplace" ? marketplace : sourceType,
            uploadKind: selectedReturnFiles.some((selected) => selected.name === file.name) ? "returns" : "sales",
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
      setSelectedSalesFiles([]);
      setSelectedReturnFiles([]);
      setHasReturnsData(false);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      const failedFiles = [...selectedSalesFiles, ...selectedReturnFiles].map((file) => ({
        name: file.name,
        marketplace,
        uploadKind: selectedReturnFiles.some((selected) => selected.name === file.name) ? "returns" : "sales",
        status: "error",
        errors: 1,
        errorMessage,
      }));

      setFiles((prev) => {
        const preservedSuccesses = prev.filter((file) => file.status === "success");
        const updated = [...preservedSuccesses, ...failedFiles];
        persistFiles(preservedSuccesses);
        return updated;
      });

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSalesFileSelect = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setSelectedSalesFiles(nextFiles);
    setMessage("");
    event.target.value = null;
  };

  const handleReturnsFileSelect = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setSelectedReturnFiles(nextFiles);
    setMessage("");
    event.target.value = null;
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
  const successfulFiles = files.filter((file) => file.status === "success");

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

      <div className="section state-section">
        <label className="state-label" htmlFor="stateOfSaleSelect">
          <span>
            State of Sale (Place of Supply)
            <span className="required-mark">*</span>
          </span>
          <small>
            Select the state your business is registered in. This determines whether tax is split as CGST + SGST (intra-state) or charged as IGST (inter-state).
          </small>
        </label>
        <div className="state-select-row">
          <select
            id="stateOfSaleSelect"
            className="state-select"
            value={stateOfSale}
            onChange={(e) => setStateOfSale(e.target.value)}
            required
          >
            <option value="">-- Select your state --</option>
            {STATE_OPTIONS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          {stateOfSale && (
            <span className="state-badge">
              ✓ {STATE_OPTIONS.find((s) => s.code === stateOfSale)?.name}
            </span>
          )}
        </div>
      </div>

      <div className="section upload-section">
        <div className="upload-panels">
          <div className="upload-box">
            <div className="upload-icon">
              <UploadIcon />
            </div>
            <h3>Upload sales data</h3>
            <p>Select one or more primary sales files for this source.</p>

            <input
              type="file"
              multiple
              hidden
              id="salesFileUpload"
              onChange={handleSalesFileSelect}
            />

            <button
              className="upload-btn"
              type="button"
              onClick={() => document.getElementById("salesFileUpload").click()}
            >
              Choose Sales Files
            </button>

            {selectedSalesFiles.length > 0 && (
              <div className="selected-file-preview">
                {selectedSalesFiles.map((file) => (
                  <div key={file.name} className="selected-file-chip">
                    {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="returns-toggle">
            <input
              type="checkbox"
              checked={hasReturnsData}
              onChange={(event) => {
                const checked = event.target.checked;
                setHasReturnsData(checked);
                if (!checked) {
                  setSelectedReturnFiles([]);
                }
              }}
            />
            <span>I also have returns / cancellation data for these sales</span>
          </label>

          {hasReturnsData && (
            <div className="upload-box upload-box--returns">
              <div className="upload-icon upload-icon--returns">
                <UploadIcon />
              </div>
              <h3>Upload returns data</h3>
              <p>Attach the matching returns file so GST calculations can exclude cancelled sales.</p>

              <input
                type="file"
                multiple
                hidden
                id="returnsFileUpload"
                onChange={handleReturnsFileSelect}
              />

              <button
                className="upload-btn secondary-upload-btn"
                type="button"
                onClick={() => document.getElementById("returnsFileUpload").click()}
              >
                Choose Returns Files
              </button>

              {selectedReturnFiles.length > 0 && (
                <div className="selected-file-preview">
                  {selectedReturnFiles.map((file) => (
                    <div key={file.name} className="selected-file-chip selected-file-chip--returns">
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="upload-submit">
            <button className="upload-btn" type="button" onClick={uploadSelectedFiles} disabled={loading}>
              {loading ? "Uploading..." : "Upload Selected Files"}
            </button>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>Uploaded Files</h3>

          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-entry">
              <div className="file-item">
                <span className="file-item-name">
                  {file.name} ({file.marketplace})
                  {file.uploadKind === "returns" ? " - returns" : ""}
                </span>
                <span className={`file-item-status ${file.status === "success" ? "success" : "error"}`}>
                  {file.status === "success" ? "Processed" : "Error"}
                </span>
                <span className="file-item-errors">{file.errors > 0 ? `${file.errors} issues` : "No errors"}</span>
                <button className="secondary file-item-action" type="button" onClick={() => removeFile(index)}>
                  Remove
                </button>
              </div>
              {file.errorMessage ? <div className="file-item-message">{file.errorMessage}</div> : null}
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

      {successfulFiles.length > 0 && (
        <div className="upload-actions">
          <button
            className="primary"
            onClick={() => {
              sessionStorage.setItem("hasReviewedData", "true");
              dispatchUploadState();
              navigate("/transactions");
            }}
          >
            Review Data &rarr;
          </button>
        </div>
      )}

      {message && <p className="upload-status">{message}</p>}
    </div>
  );
}
