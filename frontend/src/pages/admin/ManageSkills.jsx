import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

const EMPTY = { name: "", category: "frontend", proficiency: 80, order: 0, icon: "" };
const CATEGORIES = ["frontend", "backend", "database", "tools"];

export default function ManageSkills() {
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
      const res = await api.get("/skills/");
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memuat skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.get("/skills/")
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || "Gagal memuat skills");
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

  const handleEdit = (s) => {
    setForm({
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
      order: s.order,
      icon: s.icon || "",
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "proficiency" || name === "order" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/skills/${editingId}`, form);
      } else {
        await api.post("/skills/", form);
      }
      setShowModal(false);
      setNotice(editingId ? "Skill diperbarui." : "Skill ditambahkan.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menyimpan skill");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus skill ini?")) return;
    try {
      await api.delete(`/skills/${id}`);
      setNotice("Skill dihapus.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menghapus");
    }
  };

  const grouped = items.reduce((acc, s) => {
    const cat = s.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <AdminLayout
      title="Kelola skill"
      eyebrow="// SKILL"
      action={
        <button className="button primary" type="button" onClick={openComposer}>
          + TAMBAH SKILL
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
      {!loading && items.length === 0 && <p className="muted">Belum ada skill.</p>}

      <div className="skill-grid">
        {Object.entries(grouped).map(([cat, list], idx) => (
          <article className="skill-card" key={cat}>
            <p className="eyebrow">
              {String(idx + 1).padStart(2, "0")} / {cat.toUpperCase()}
            </p>
            <div className="tag-row">
              {list.map((s) => (
                <span className="tag" key={s.id} style={{ position: "relative", paddingRight: 28 }}>
                  {s.name}
                  <button
                    type="button"
                    onClick={() => handleEdit(s)}
                    style={{
                      position: "absolute",
                      right: 4,
                      top: 2,
                      background: "none",
                      border: 0,
                      color: "var(--gold)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      cursor: "pointer",
                    }}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    style={{
                      position: "absolute",
                      right: 4,
                      bottom: 2,
                      background: "none",
                      border: 0,
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      cursor: "pointer",
                    }}
                    title="Hapus"
                  >
                    ×
                  </button>
                </span>
              ))}
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
          >
            <p className="eyebrow">// {editingId ? "EDIT SKILL" : "SKILL BARU"}</p>
            <h2>{editingId ? `Edit skill #${editingId}` : "Tambahkan skill"}</h2>

            {error && (
              <p style={{ color: "var(--gold-bright)", fontSize: 11, margin: 0 }}>{error}</p>
            )}

            <label>
              <span>NAMA</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="React"
                required
                autoFocus
              />
            </label>
            <label>
              <span>KATEGORI</span>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span>PROFICIENCY (0-100)</span>
                <input
                  name="proficiency"
                  type="number"
                  min="0"
                  max="100"
                  value={form.proficiency}
                  onChange={handleChange}
                />
              </label>
              <label>
                <span>URUTAN</span>
                <input
                  name="order"
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={handleChange}
                />
              </label>
            </div>

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