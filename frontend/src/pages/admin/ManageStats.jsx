import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function ManageStats() {
  const [items, setItems] = useState([]);
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ label: "", value: "", order: 0 });

  const load = async () => {
    try {
      const res = await api.get("/stats/");
      setItems(res.data);
      const map = {};
      res.data.forEach((s) => {
        map[s.id] = { label: s.label, value: s.value };
      });
      setOriginal(map);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memuat stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.get("/stats/")
      .then((res) => {
        if (!cancelled) {
          setItems(res.data);
          const map = {};
          res.data.forEach((s) => {
            map[s.id] = { label: s.label, value: s.value };
          });
          setOriginal(map);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || "Gagal memuat stats");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const isDirty = (id) => {
    const item = items.find((s) => s.id === id);
    const orig = original[id];
    if (!item || !orig) return false;
    return item.label !== orig.label || item.value !== orig.value;
  };

  const anyDirty = items.some((s) => isDirty(s.id));

  const saveAll = async () => {
    setError("");
    setSaving(true);
    try {
      const dirtyItems = items.filter((s) => isDirty(s.id));
      await Promise.all(
        dirtyItems.map((s) =>
          api.put(`/stats/${s.id}`, { label: s.label, value: s.value })
        )
      );
      setNotice(`${dirtyItems.length} stat diperbarui.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus stat ini?")) return;
    try {
      await api.delete(`/stats/${id}`);
      setNotice("Stat dihapus.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menghapus");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/stats/", {
        label: newItem.label,
        value: newItem.value,
        order: Number(newItem.order) || items.length + 1,
      });
      setNewItem({ label: "", value: "", order: 0 });
      setShowAddForm(false);
      setNotice("Stat ditambahkan.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menambahkan");
    }
  };

  return (
    <AdminLayout
      title="Kelola stats"
      eyebrow="// STATS"
      action={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="button outline"
            type="button"
            onClick={() => setShowAddForm(true)}
          >
            + TAMBAH STAT
          </button>
          <button
            className="button primary"
            type="button"
            onClick={saveAll}
            disabled={!anyDirty || saving}
          >
            {saving ? "MENYIMPAN..." : "SIMPAN SEMUA"}
          </button>
        </div>
      }
    >
      {error && (
        <button className="admin-notice" type="button" onClick={() => setError("")}>
          {error} <span>TUTUP</span>
        </button>
      )}
      {notice && (
        <button className="admin-notice" type="button" onClick={() => setNotice("")}>
          {notice} <span>TUTUP</span>
        </button>
      )}

      <section className="admin-panel">
        <div className="panel-title">
          <h2>Statistik portofolio</h2>
          <span>{items.length} ITEM</span>
        </div>

        <p className="muted" style={{ marginTop: 12, marginBottom: 16, fontSize: 12 }}>
          Edit langsung di tabel, lalu klik SIMPAN SEMUA. Urutan tampil mengikuti
          kolom ORDER (kecil → besar).
        </p>

        {loading && <p className="muted">Memuat...</p>}
        {!loading && items.length === 0 && (
          <p className="muted">Belum ada stat.</p>
        )}

        {!loading && items.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["VALUE", "LABEL", "ORDER", "AKSI"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 8px",
                        borderBottom: "1px solid var(--line)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--muted)",
                        letterSpacing: "0.06em",
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: "10px 8px", width: "20%" }}>
                      <input
                        value={s.value}
                        onChange={(e) => handleChange(s.id, "value", e.target.value)}
                        maxLength={30}
                        style={{
                          width: "100%",
                          minHeight: 40,
                          padding: "8px 10px",
                          border: `1px solid ${
                            isDirty(s.id) ? "var(--gold-bright)" : "rgba(232,185,60,0.28)"
                          }`,
                          background: "var(--panel-2)",
                          color: "var(--gold)",
                          fontSize: 16,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <input
                        value={s.label}
                        onChange={(e) => handleChange(s.id, "label", e.target.value)}
                        maxLength={80}
                        style={{
                          width: "100%",
                          minHeight: 40,
                          padding: "8px 10px",
                          border: `1px solid ${
                            isDirty(s.id) ? "var(--gold-bright)" : "rgba(232,185,60,0.28)"
                          }`,
                          background: "var(--panel-2)",
                          color: "var(--cream)",
                          fontSize: 13,
                          fontFamily: "var(--font-mono)",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--muted)",
                        width: 80,
                      }}
                    >
                      {s.order}
                    </td>
                    <td style={{ padding: "10px 8px", width: 90 }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="table-actions"
                        style={{
                          background: "none",
                          border: "1px solid rgba(241,235,218,0.22)",
                          color: "var(--muted)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 9,
                          padding: "8px 12px",
                          cursor: "pointer",
                        }}
                      >
                        HAPUS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAddForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowAddForm(false)}>
          <form
            className="project-modal"
            onSubmit={handleAdd}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="eyebrow">// STAT BARU</p>
            <h2>Tambahkan stat</h2>
            <label>
              <span>VALUE</span>
              <input
                value={newItem.value}
                onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                placeholder="04+"
                required
                maxLength={30}
                autoFocus
              />
            </label>
            <label>
              <span>LABEL</span>
              <input
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                placeholder="TAHUN PENGALAMAN"
                required
                maxLength={80}
              />
            </label>
            <label style={{ maxWidth: 140 }}>
              <span>ORDER</span>
              <input
                type="number"
                min="0"
                value={newItem.order}
                onChange={(e) => setNewItem({ ...newItem, order: e.target.value })}
              />
            </label>
            <div className="button-row">
              <button className="button primary" type="submit">
                TAMBAH
              </button>
              <button
                className="button outline"
                type="button"
                onClick={() => setShowAddForm(false)}
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