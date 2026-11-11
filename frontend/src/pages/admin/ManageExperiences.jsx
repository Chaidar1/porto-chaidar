import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

const EMPTY = {
  role: "",
  company: "",
  description: "",
  start_date: "",
  end_date: "",
  is_current: 0,
  order: 0,
};

function formatPeriod(exp) {
  const start = exp.start_date
    ? new Date(exp.start_date).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      })
    : "";
  const end = exp.is_current
    ? "SEKARANG"
    : exp.end_date
    ? new Date(exp.end_date).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      })
    : "";
  return `${start} — ${end}`.toUpperCase();
}

export default function ManageExperiences() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/experiences/");
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memuat pengalaman");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.get("/experiences/")
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || "Gagal memuat pengalaman");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const openComposer = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (exp) => {
    setForm({
      role: exp.role,
      company: exp.company,
      description: exp.description || "",
      start_date: exp.start_date || "",
      end_date: exp.end_date || "",
      is_current: exp.is_current,
      order: exp.order,
    });
    setEditingId(exp.id);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked ? 1 : 0 }));
      return;
    }
    setForm((f) => ({
      ...f,
      [name]: name === "order" ? Number(value) : value,
    }));
  };

  const buildPayload = () => ({
    role: form.role,
    company: form.company,
    description: form.description || null,
    start_date: form.start_date,
    end_date: form.is_current ? null : form.end_date || null,
    is_current: form.is_current,
    order: form.order,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/experiences/${editingId}`, buildPayload());
      } else {
        await api.post("/experiences/", buildPayload());
      }
      setShowModal(false);
      setNotice(editingId ? "Pengalaman diperbarui." : "Pengalaman ditambahkan.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menyimpan pengalaman");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus pengalaman ini?")) return;
    try {
      await api.delete(`/experiences/${id}`);
      setNotice("Pengalaman dihapus.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menghapus");
    }
  };

  return (
    <AdminLayout
      title="Kelola pengalaman"
      eyebrow="// PENGALAMAN"
      action={
        <button className="button primary" type="button" onClick={openComposer}>
          + TAMBAH PENGALAMAN
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
      {!loading && items.length === 0 && <p className="muted">Belum ada pengalaman.</p>}

      <div className="experience-list">
        {items.map((exp) => (
          <article className="experience-card" key={exp.id}>
            <p className="eyebrow">{formatPeriod(exp)}</p>
            <h3>{exp.role}</h3>
            <p className="muted">{exp.company}</p>
            {exp.description && (
              <ul>
                {exp.description
                  .split("\n")
                  .filter(Boolean)
                  .map((point) => (
                    <li key={point}>{point}</li>
                  ))}
              </ul>
            )}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                borderTop: "1px solid var(--line)",
                paddingTop: 12,
              }}
            >
              <button
                type="button"
                onClick={() => handleEdit(exp)}
                className="button outline"
                style={{ minHeight: 36, padding: "0 14px", fontSize: 10 }}
              >
                EDIT
              </button>
              <button
                type="button"
                onClick={() => handleDelete(exp.id)}
                className="button outline"
                style={{
                  minHeight: 36,
                  padding: "0 14px",
                  fontSize: 10,
                  color: "var(--muted)",
                  borderColor: "rgba(241,235,218,0.22)",
                }}
              >
                HAPUS
              </button>
            </div>
          </article>
        ))}
      </div>

      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
          <form
            className="project-modal"
            onSubmit={handleSubmit}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <p className="eyebrow">// {editingId ? "EDIT PENGALAMAN" : "PENGALAMAN BARU"}</p>
            <h2>{editingId ? `Edit #${editingId}` : "Tambahkan pengalaman"}</h2>

            {error && (
              <p style={{ color: "var(--gold-bright)", fontSize: 11, margin: 0 }}>{error}</p>
            )}

            <label>
              <span>ROLE / POSISI</span>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="Fullstack Developer"
                required
                autoFocus
              />
            </label>
            <label>
              <span>PERUSAHAAN</span>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="PT Contoh Teknologi"
                required
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span>TANGGAL MULAI</span>
                <input
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                <span>TANGGAL SELESAI</span>
                <input
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleChange}
                  disabled={form.is_current === 1}
                />
              </label>
            </div>
            <label style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex" }}>
              <input
                type="checkbox"
                name="is_current"
                checked={form.is_current === 1}
                onChange={handleChange}
              />
              <span>MASIH BEKERJA DI SINI</span>
            </label>
            <label>
              <span>DESKRIPSI (satu poin per baris)</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder={"Membangun REST API dengan FastAPI\nMemimpin migrasi database"}
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
    </AdminLayout>
  );
}