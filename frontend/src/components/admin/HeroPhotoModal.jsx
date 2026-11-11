import { useRef, useState } from "react";
import api from "../../services/api";

function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    ""
  );
  return `${base}${url}`;
}

export default function HeroPhotoModal({ current, onClose, onChanged }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(
    current ? resolveImageUrl(current.image_url) : ""
  );
  const [posX, setPosX] = useState(current?.position_x ?? 50);
  const [posY, setPosY] = useState(current?.position_y ?? 50);
  const [hasNewFile, setHasNewFile] = useState(false);
  const [prevCurrent, setPrevCurrent] = useState(current);

  if (current !== prevCurrent) {
    setPrevCurrent(current);
    setPreviewUrl(current ? resolveImageUrl(current.image_url) : "");
    setPosX(current?.position_x ?? 50);
    setPosY(current?.position_y ?? 50);
    setHasNewFile(false);
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPreviewUrl(URL.createObjectURL(file));
    setHasNewFile(true);
    // posisi reset ke tengah saat file baru dipilih
    setPosX(50);
    setPosY(50);
  };

  const handleSave = async () => {
    setError("");
    setUploading(true);
    try {
      const file = fileRef.current?.files?.[0];

      // Kalau ada file baru → upload ulang (POST) dengan posisi
      if (hasNewFile && file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("position_x", String(posX));
        fd.append("position_y", String(posY));
        await api.post("/hero/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (current) {
        // Kalau hanya geser → update posisi saja (PATCH)
        await api.patch("/hero/position", {
          position_x: posX,
          position_y: posY,
        });
      } else {
        setError("Pilih file foto terlebih dahulu.");
        setUploading(false);
        return;
      }

      await onChanged();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menyimpan foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus foto hero?")) return;
    setError("");
    setUploading(true);
    try {
      await api.delete("/hero/");
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menghapus foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="project-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width: "min(560px, 100%)", maxHeight: "92vh", overflowY: "auto" }}
      >
        <p className="eyebrow">// FOTO HERO</p>
        <h2>{current ? "Atur foto hero" : "Tambahkan foto hero"}</h2>

        {error && (
          <p style={{ color: "var(--gold-bright)", fontSize: 11, margin: 0 }}>
            {error}
          </p>
        )}

        {/* Preview dengan objectPosition sesuai posisi */}
        <div
          style={{
            width: "100%",
            aspectRatio: "4 / 5",
            maxHeight: 300,
            border: "1px solid var(--line)",
            background: "var(--panel-2)",
            position: "relative",
            overflow: "hidden",
            margin: "0 auto",
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${posX}% ${posY}%`,
                transition: "object-position 80ms linear",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
            >
              BELUM ADA FOTO
            </div>
          )}

          {/* Grid guideline */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(rgba(232,185,60,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(232,185,60,0.18) 1px, transparent 1px)",
              backgroundSize: "33.33% 33.33%",
            }}
          />
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--muted)",
            margin: 0,
            textAlign: "center",
          }}
        >
          X: {posX.toFixed(0)}% · Y: {posY.toFixed(0)}%
        </p>

        {/* Slider X dan Y */}
        <label>
          <span>GESER HORIZONTAL (X)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={posX}
            onChange={(e) => setPosX(Number(e.target.value))}
            disabled={uploading}
            style={{ width: "100%", accentColor: "var(--gold)" }}
          />
        </label>
        <label>
          <span>GESER VERTIKAL (Y)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={posY}
            onChange={(e) => setPosY(Number(e.target.value))}
            disabled={uploading}
            style={{ width: "100%", accentColor: "var(--gold)" }}
          />
        </label>

        {/* File picker */}
        <label>
          <span>{current ? "GANTI FILE FOTO" : "PILIH FILE FOTO"}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            style={{
              width: "100%",
              padding: 10,
              border: "1px dashed rgba(232,185,60,0.4)",
              background: "var(--panel-2)",
              color: "var(--muted)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          />
          <small style={{ color: "var(--muted)", fontSize: 10 }}>
            Maks 5 MB · JPG / PNG / WebP / GIF
          </small>
        </label>

        {uploading && (
          <p style={{ color: "var(--gold)", fontSize: 11, margin: 0 }}>
            Memproses...
          </p>
        )}

        <div className="button-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={uploading || (!previewUrl && !hasNewFile)}
            className="button primary"
          >
            {uploading ? "MENYIMPAN..." : "SIMPAN"}
          </button>
          {current && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              className="button outline"
              style={{
                color: "var(--muted)",
                borderColor: "rgba(241,235,218,0.22)",
              }}
            >
              HAPUS FOTO
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="button outline"
          >
            BATAL
          </button>
        </div>
      </div>
    </div>
  );
}