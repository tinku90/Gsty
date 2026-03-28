import { useState } from "react";
import API from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("stateCode", "36");

    const res = await API.post("/upload-excel", formData);

    console.log(res.data);
    alert("Uploaded successfully");
  };

  return (
    <div>
      <h2>Upload Data</h2>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Upload</button>
    </div>
  );
}