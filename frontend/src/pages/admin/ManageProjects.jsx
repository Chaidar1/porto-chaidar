import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

const EMPTY = {
  title: "",
  slug: "",
  category: "fullstack",
  description: "",
  tech_stack: "",
  image_url: "",
  demo_url: "",
  repo_url: "",
  is_featured: false,
  is_published: true,
};

const CATEGORY_OPTIONS = [
  { value: "fullstack", label: "Fullstack" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
];

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    ""
  );
  return `${base}${url}`;
}

export default function ManageProjects() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/projects/");
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memuat projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.get("/projects/")
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || "Gagal memuat projects");
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

  const handleEdit = (p) => {
    setForm({
      title: p.title,
      slug: p.slug,
      category: p.category || "fullstack",
      description: p.description || "",
      tech_stack: (p.tech_stack || []).join(", "),
      image_url: p.image_url || "",
      demo_url: p.demo_url || "",
      repo_url: p.repo_url || "",
      is_featured: p.is_featured,
      is_published: p.is_published,
    });
    setEditingId(p.id);
    setError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
      return;
    }
    if (name === "title" && !editingId) {
      setForm((f) => ({
        ...f,
        title: value,
        slug: f.slug === slugify(f.title) || f.slug === "" ? slugify(value) : f.slug,
      }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, image_url: res.data.url }));
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal upload gambar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const buildPayload = () => ({
    title: form.title,
    slug: form.slug,
    category: form.category,
    description: form.description || null,
    tech_stack: form.tech_stack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    image_url: form.image_url || null,
    demo_url: form.demo_url || null,
    repo_url: form.repo_url || null,
    is_featured: form.is_featured,
    is_published: form.is_published,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/projects/${editingId}`, buildPayload());
      } else {
        await api.post("/projects/", buildPayload());
      }
      setShowModal(false);
      setNotice(editingId ? "Project diperbarui." : "Project baru ditambahkan.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menyimpan project");
    }
  };

  const togglePublish = async (p) => {
    try {
      await api.put(`/projects/${p.id}`, { is_published: !p.is_published });
      setNotice("Status publikasi diperbarui.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memperbarui");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus project ini?")) return;
    try {
      await api.delete(`/projects/${id}`);
      setNotice("Project dihapus.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menghapus");
    }
  };

  return (
    <AdminLayout
      title="Kelola project"
      eyebrow="// PROJECT"
      action={
        <button className="button primary" type="button" onClick={openComposer}>
          + TAMBAH PROJECT
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

      <section className="admin-panel project-table-panel">
        <div className="panel-title">
          <h2>Daftar project</h2>
          <span>{items.length} TOTAL</span>
        </div>
        <div className="project-table">
          <div className="table-row table-head">
            <span>JUDUL</span>
            <span>SLUG</span>
            <span>STATUS</span>
            <span>AKSI</span>
          </div>
          {loading && (
            <div className="table-row">
              <strong style={{ color: "var(--muted)" }}>Memuat...</strong>
              <span />
              <span />
              <span />
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="table-row">
              <strong style={{ color: "var(--muted)" }}>Belum ada project.</strong>
              <span />
              <span />
              <span />
            </div>
          )}
          {items.map((p) => (
            <div className="table-row" key={p.id}>
              <strong>
                {p.title}
                {p.is_featured && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: "var(--gold)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                    }}
                  >
                    ★
                  </span>
                )}
                <br />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--gold)",
                  }}
                >
                  {p.category?.toUpperCase()}
                </span>
              </strong>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
                {p.slug}
              </span>
              <button
                className={p.is_published ? "status public" : "status"}
                type="button"
                onClick={() => togglePublish(p)}
                title="Klik untuk toggle status"
              >
                {p.is_published ? "PUBLIK" : "DRAFT"}
              </button>
              <span className="table-actions">
                <button type="button" onClick={() => handleEdit(p)}>
                  EDIT
                </button>
                <button type="button" onClick={() => handleDelete(p.id)}>
                  HAPUS
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
          <form
            className="project-modal"
            onSubmit={handleSubmit}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto", width: "min(560px, 100%)" }}
          >
            <p className="eyebrow">// {editingId ? "EDIT PROJECT" : "PROJECT BARU"}</p>
            <h2>{editingId ? `Edit project #${editingId}` : "Tambahkan project"}</h2>

            {error && (
              <p style={{ color: "var(--gold-bright)", fontSize: 11, margin: 0 }}>{error}</p>
            )}

            <label>
              <span>JUDUL</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Nama project"
                required
                autoFocus
              />
            </label>

            <label>
              <span>SLUG</span>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="nama-project"
                required
              />
            </label>

            <label>
              <span>KATEGORI</span>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>DESKRIPSI</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Deskripsi singkat"
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

            <label>
              <span>TECH STACK (pisahkan koma)</span>
              <input
                name="tech_stack"
                value={form.tech_stack}
                onChange={handleChange}
                placeholder="React, FastAPI, PostgreSQL"
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span>LIVE DEMO</span>
                <input
                  name="demo_url"
                  value={form.demo_url}
                  onChange={handleChange}
                  placeholder="https://"
                />
              </label>
              <label>
                <span>REPO URL</span>
                <input
                  name="repo_url"
                  value={form.repo_url}
                  onChange={handleChange}
                  placeholder="https://github.com"
                />
              </label>
            </div>

            <label>
              <span>GAMBAR PROJECT</span>
              {form.image_url ? (
                <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
                  <img
                    src={resolveImageUrl(form.image_url)}
                    alt="preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 160,
                      border: "1px solid var(--line)",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "var(--gold)",
                      color: "#090909",
                      border: 0,
                      width: 24,
                      height: 24,
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleImageUpload}
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
              )}
              {uploading && (
                <small style={{ color: "var(--gold)", fontSize: 10 }}>Mengunggah...</small>
              )}
            </label>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <label
                style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex" }}
              >
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={form.is_featured}
                  onChange={handleChange}
                />
                <span>FEATURED</span>
              </label>
              <label
                style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex" }}
              >
                <input
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={handleChange}
                />
                <span>PUBLISH</span>
              </label>
            </div>

            <div className="button-row">
              <button className="button primary" type="submit" disabled={uploading}>
                {editingId ? "SIMPAN PERUBAHAN" : "SIMPAN PROJECT"}
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
    </AdminLayout>
  );
}