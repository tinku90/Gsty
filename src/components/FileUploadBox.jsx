import { useRef } from "react";

export default function FileUploadBox({ onFileSelect, onUpload, loading }) {
  const fileInputRef = useRef();

  const handleFileClick = () => {
  console.log("BUTTON CLICKED"); // ✅ DEBUG
  fileInputRef.current.click();
};

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  console.log("FILE SELECTED:", file); // ✅ DEBUG

  if (!file) return;

  if (onFileSelect) {
    onFileSelect(file);
  }
  if (onUpload) {
    onUpload(file);
  }
};

  return (
    <div className="upload-box">

      {/* HIDDEN INPUT */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* ICON */}
      <div className="upload-icon">⬆️</div>

      <h3>Drag and drop your file here</h3>
      <p className="upload-subtext">or click to browse</p>

      {/* SINGLE BUTTON */}
      <button onClick={handleFileClick} disabled={loading}>
        {loading ? "Uploading..." : "Select File"}
      </button>

      <p className="formats">
        Supported formats: .xlsx, .xls, .csv (Max 10MB)
      </p>
    </div>
  );
}