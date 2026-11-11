import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

const EMPTY = {
  category: "education",
  title: "",
  subtitle: "",
  description: "",
  link_url: "",
  link_label: "",
  order: 0,
};

const CATEGORIES = [
  { value: "education", label: "Pendidikan" },
  { value: "certification", label: "Sertifikasi" },
  { value: "organization", label: "Organisasi" },
];

const LABELS = {
  education: "PENDIDIKAN",
  certification: "SERTIFIKASI",
  organization: "ORGANISASI",
};

function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    ""
  );
  return `${base}${url}`;
}

export default function ManageBackground() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // State untuk custom confirm modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // album state
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumItem, setAlbumItem] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [albumUploading, setAlbumUploading] = useState(false);
  const [albumError, setAlbumError] = useState("");
  const [editingPhoto, setEditingPhoto] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/backgrounds/");
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memuat background");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.get("/backgrounds/")
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || "Gagal memuat background");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const openComposer = () => {
    setForm(EMPTY);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setForm({
      category: item.category,
      title: item.title,
      subtitle: item.subtitle || "",
      description: item.description || "",
      link_url: item.link_url || "",
      link_label: item.link_label || "",
      order: item.order,
    });
    setEditingId(item.id);
    setError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "order" ? Number(value) : value,
    }));
  };

  const buildPayload = () => ({
    category: form.category,
    title: form.title,
    subtitle: form.subtitle || null,
    description: form.description || null,
    link_url: form.link_url || null,
    link_label: form.link_label || null,
    order: form.order,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/backgrounds/${editingId}`, buildPayload());
      } else {
        await api.post("/backgrounds/", buildPayload());
      }
      setShowModal(false);
      setNotice(editingId ? "Item diperbarui." : "Item ditambahkan.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menyimpan");
    }
  };

  // Fungsi hapus item (memicu custom confirm)
  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Item?",
      message: "Item ini beserta semua fotonya akan dihapus secara permanen.",
      onConfirm: async () => {
        try {
          await api.delete(`/backgrounds/${id}`);
          setNotice("Item dihapus.");
          await load();
        } catch (err) {
          setError(err.response?.data?.detail || "Gagal menghapus");
        }
        setConfirmModal({ isOpen: false });
      },
    });
  };

  // ── Album management ─────────────────────────────────────────────

  const openAlbum = (item) => {
    setAlbumItem(item);
    setAlbumPhotos(item.photos || []);
    setAlbumError("");
    setShowAlbumModal(true);
  };

  const refreshAlbum = async () => {
    if (!albumItem) return;
    try {
      const res = await api.get(`/backgrounds/${albumItem.id}/photos`);
      setAlbumPhotos(res.data);
      setAlbumItem((prev) => (prev ? { ...prev, photos: res.data } : prev));
      await load();
    } catch (err) {
      setAlbumError(err.response?.data?.detail || "Gagal refresh album");
    }
  };

  const handleUploadPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !albumItem) return;

    setAlbumUploading(true);
    setAlbumError("");
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("order", String(albumPhotos.length + 1));
        await api.post(`/backgrounds/${albumItem.id}/photos`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await refreshAlbum();
    } catch (err) {
      setAlbumError(err.response?.data?.detail || "Gagal upload foto");
    } finally {
      setAlbumUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Fungsi hapus foto (memicu custom confirm)
  const handleDeletePhoto = (photoId) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Foto?",
      message: "Foto ini akan dihapus dari album secara permanen.",
      onConfirm: async () => {
        try {
          await api.delete(`/backgrounds/photos/${photoId}`);
          await refreshAlbum();
        } catch (err) {
          setAlbumError(err.response?.data?.detail || "Gagal menghapus foto");
        }
        setConfirmModal({ isOpen: false });
      },
    });
  };

  const startEditPhoto = (photo) => {
    setEditingPhoto({
      id: photo.id,
      caption: photo.caption || "",
      credit: photo.credit || "",
      alt: photo.alt || "",
    });
  };

  const savePhotoMeta = async () => {
    if (!editingPhoto) return;
    try {
      await api.put(`/backgrounds/photos/${editingPhoto.id}`, {
        caption: editingPhoto.caption || null,
        credit: editingPhoto.credit || null,
        alt: editingPhoto.alt || null,
      });
      setEditingPhoto(null);
      await refreshAlbum();
    } catch (err) {
      setAlbumError(err.response?.data?.detail || "Gagal menyimpan metadata foto");
    }
  };

  const movePhotoOrder = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= albumPhotos.length) return;

    const newPhotos = [...albumPhotos];
    
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[newIndex];
    newPhotos[newIndex] = temp;

    setAlbumPhotos(newPhotos);

    try {
      for (let i = 0; i < newPhotos.length; i++) {
        await api.put(`/backgrounds/photos/${newPhotos[i].id}`, {
          order: i + 1,
        });
      }
      setNotice("Urutan foto diperbarui.");
      await refreshAlbum();
    } catch {
      setAlbumError("Gagal menyimpan urutan foto");
      await refreshAlbum();
    }
  };

  // ── Render ──────────────────────────────────────────────────────

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <AdminLayout
      title="Kelola latar belakang"
      eyebrow="// LATAR BELAKANG"
      action={
        <button className="button primary" type="button" onClick={openComposer}>
          + TAMBAH ITEM
        </button>
      }
    >
      {error && !showModal && (
        <button className="admin-notice" type="button" onClick={() => setError("")}>
          {error} <span>TUTUP</span>
        </button>
      )}
      {notice && (
        <button className="admin-notice" type="button" onClick={() => setNotice("")}>
          {notice} <span>TUTUP</span>
        </button>
      )}

      {loading && <p className="muted">Memuat...</p>}
      {!loading && items.length === 0 && (
        <p className="muted">
          Belum ada data. Tambahkan pendidikan, sertifikasi, atau organisasi.
        </p>
      )}

      <div className="background-grid">
        {CATEGORIES.map((cat) => {
          const list = grouped[cat.value] || [];
          return (
            <article className="info-card" key={cat.value}>
              <p className="eyebrow">{LABELS[cat.value]}</p>
              {list.length === 0 && (
                <p className="muted" style={{ fontSize: 12 }}>
                  Belum ada item.
                </p>
              )}
              {list.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(232,185,60,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <h3 style={{ fontSize: 15, margin: 0 }}>{item.title}</h3>
                  {item.subtitle && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--muted)",
                        margin: 0,
                      }}
                    >
                      {item.subtitle}
                    </p>
                  )}
                  {item.photos?.length > 0 && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--gold)",
                        margin: 0,
                      }}
                    >
                      {item.photos.length} FOTO
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      style={{
                        background: "none",
                        border: 0,
                        color: "var(--gold)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      onClick={() => openAlbum(item)}
                      style={{
                        background: "none",
                        border: 0,
                        color: "var(--gold)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      ALBUM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: "none",
                        border: 0,
                        color: "var(--muted)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      HAPUS
                    </button>
                  </div>
                </div>
              ))}
            </article>
          );
        })}
      </div>

      {/* Modal edit background */}
      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
          <form
            className="project-modal"
            onSubmit={handleSubmit}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxHeight: "92vh", overflowY: "auto", width: "min(560px, 100%)" }}
          >
            <p className="eyebrow">// {editingId ? "EDIT ITEM" : "ITEM BARU"}</p>
            <h2>{editingId ? `Edit #${editingId}` : "Tambah latar belakang"}</h2>

            {error && (
              <p style={{ color: "var(--gold-bright)", fontSize: 11, margin: 0 }}>{error}</p>
            )}

            <label>
              <span>KATEGORI</span>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>JUDUL</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={200}
                placeholder="Universitas Teknologi Indonesia"
                autoFocus
              />
            </label>

            <label>
              <span>SUBJUDUL / PERIODE</span>
              <input
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                maxLength={200}
                placeholder="Teknik Informatika · 2017 — 2021"
              />
            </label>

            <label>
              <span>DESKRIPSI (opsional)</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="IPK 3.78 · Fokus rekayasa perangkat lunak."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid rgba(232,185,60,0.28)",
                  background: "var(--panel-2)",
                  color: "var(--cream)",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span>LINK URL</span>
                <input
                  name="link_url"
                  value={form.link_url}
                  onChange={handleChange}
                  maxLength={255}
                  placeholder="https://drive.google.com/..."
                />
              </label>
              <label>
                <span>LINK LABEL</span>
                <input
                  name="link_label"
                  value={form.link_label}
                  onChange={handleChange}
                  maxLength={80}
                  placeholder="LIHAT SERTIFIKAT ↗"
                />
              </label>
            </div>

            <label style={{ maxWidth: 140 }}>
              <span>URUTAN</span>
              <input
                name="order"
                type="number"
                min="0"
                value={form.order}
                onChange={handleChange}
              />
            </label>

            <div className="button-row">
              <button className="button primary" type="submit">
                {editingId ? "SIMPAN" : "TAMBAH"}
              </button>
              <button
                className="button outline"
                type="button"
                onClick={() => setShowModal(false)}
              >
                BATAL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal album manager */}
      {showAlbumModal && albumItem && (
        <div className="modal-backdrop" onMouseDown={() => setShowAlbumModal(false)}>
          <div
            className="project-modal"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxHeight: "92vh", overflowY: "auto", width: "min(680px, 100%)" }}
          >
            <p className="eyebrow">// ALBUM · {albumItem.title.toUpperCase()}</p>
            <h2>Kelola foto album</h2>

            {albumError && (
              <p style={{ color: "var(--gold-bright)", fontSize: 11, margin: 0 }}>
                {albumError}
              </p>
            )}

            <div className="album-admin-grid">
              {albumPhotos.map((photo, idx) => (
                <div className="album-admin-tile" key={photo.id}>
                  <img
                    src={resolveImageUrl(photo.image_url)}
                    alt={photo.alt || `Foto ${idx + 1}`}
                  />
                  
                  <div className="album-order-controls">
                    <button
                      type="button"
                      onClick={() => movePhotoOrder(idx, -1)}
                      disabled={idx === 0}
                      title="Geser kiri (Jadikan Utama)"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhotoOrder(idx, 1)}
                      disabled={idx === albumPhotos.length - 1}
                      title="Geser kanan"
                    >
                      ›
                    </button>
                  </div>

                  <span className="album-admin-badge">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  
                  <button
                    type="button"
                    className="album-admin-remove"
                    onClick={() => handleDeletePhoto(photo.id)}
                    title="Hapus foto"
                  >
                    ×
                  </button>
                  <div className="album-admin-edit">
                    <button
                      type="button"
                      onClick={() => startEditPhoto(photo)}
                      style={{
                        background: "var(--gold)",
                        color: "#090909",
                        border: 0,
                        padding: "4px 8px",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        cursor: "pointer",
                        flex: "none",
                      }}
                      title="Edit caption"
                    >
                      EDIT
                    </button>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        alignSelf: "center",
                        flex: 1,
                      }}
                    >
                      {photo.caption || "—"}
                    </span>
                  </div>
                </div>
              ))}

              <label
                className="album-admin-add"
                style={{ cursor: albumUploading ? "wait" : "pointer" }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleUploadPhoto}
                  disabled={albumUploading}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: 24 }}>+</span>
                <span>{albumUploading ? "MENGUNGGAH..." : "TAMBAH FOTO"}</span>
              </label>
            </div>

            {editingPhoto && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  border: "1px solid var(--line)",
                  background: "var(--panel-2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p className="eyebrow" style={{ margin: 0 }}>
                  // EDIT METADATA FOTO #{editingPhoto.id}
                </p>
                <label>
                  <span>CAPTION</span>
                  <input
                    value={editingPhoto.caption}
                    onChange={(e) =>
                      setEditingPhoto({ ...editingPhoto, caption: e.target.value })
                    }
                    maxLength={255}
                    placeholder="Hari kelulusan..."
                  />
                </label>
                <label>
                  <span>CREDIT / SUMBER</span>
                  <input
                    value={editingPhoto.credit}
                    onChange={(e) =>
                      setEditingPhoto({ ...editingPhoto, credit: e.target.value })
                    }
                    maxLength={255}
                    placeholder="Foto oleh ..."
                  />
                </label>
                <label>
                  <span>ALT / TEKS ALTERNATIF</span>
                  <input
                    value={editingPhoto.alt}
                    onChange={(e) =>
                      setEditingPhoto({ ...editingPhoto, alt: e.target.value })
                    }
                    maxLength={255}
                    placeholder="Deskripsi singkat untuk aksesibilitas"
                  />
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="button primary"
                    onClick={savePhotoMeta}
                    style={{ minHeight: 36, fontSize: 11 }}
                  >
                    SIMPAN METADATA
                  </button>
                  <button
                    type="button"
                    className="button outline"
                    onClick={() => setEditingPhoto(null)}
                    style={{ minHeight: 36, fontSize: 11 }}
                  >
                    BATAL
                  </button>
                </div>
              </div>
            )}

            <div className="button-row">
              <button
                className="button outline"
                type="button"
                onClick={() => setShowAlbumModal(false)}
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="modal-backdrop" onMouseDown={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
          <div
            className="project-modal"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: 400, textAlign: "center", alignItems: "center" }}
          >
            <p className="eyebrow" style={{ color: "var(--gold)" }}>// KONFIRMASI</p>
            <h2 style={{ fontSize: 22, marginTop: 4 }}>{confirmModal.title}</h2>
            <p className="muted" style={{ marginBottom: 16 }}>{confirmModal.message}</p>
            
            <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 8 }}>
              <button
                type="button"
                className="button primary"
                onClick={confirmModal.onConfirm}
                style={{ flex: 1, background: "var(--gold)", color: "#000", border: 0 }}
              >
                YA, HAPUS
              </button>
              <button
                type="button"
                className="button outline"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                style={{ flex: 1 }}
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}