import { useRef, useState } from "react";
import api from "../../services/api";

export default function ResumeUploadModal({ onClose, onChanged }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("File harus berformat PDF.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post("/resume/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal upload CV");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="project-modal" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <p className="eyebrow">// UPDATE CV</p>
        <h2>Upload Curriculum Vitae</h2>
        {error && <p style={{ color: "var(--gold-bright)", fontSize: 11 }}>{error}</p>}
        <label>
          <span>PILIH FILE PDF (Maks 10 MB)</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            style={{
              width: "100%", padding: 10, border: "1px dashed rgba(232,185,60,0.4)",
              background: "var(--panel-2)", color: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)"
            }}
          />
        </label>
        {uploading && <p style={{ color: "var(--gold)", fontSize: 11 }}>Mengunggah...</p>}
        <div className="button-row">
          <button className="button outline" type="button" onClick={onClose} disabled={uploading}>
            BATAL
          </button>
        </div>
      </div>
    </div>
  );
}