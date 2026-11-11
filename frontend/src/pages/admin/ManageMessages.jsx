import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function ManageMessages() {
  const [items, setItems] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // State untuk custom confirm modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    let cancelled = false;
    api.get("/messages/", {
      params: unreadOnly ? { unread_only: true } : {},
    })
      .then((res) => {
        if (!cancelled) {
          setItems(res.data);
          setSelected((prev) => (prev && !res.data.find((m) => m.id === prev.id) ? null : prev));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || "Gagal memuat pesan");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [unreadOnly]);

  const handleOpen = async (msg) => {
    setSelected(msg);
    if (!msg.is_read) {
      try {
        const res = await api.patch(`/messages/${msg.id}/read`);
        setItems((prev) => prev.map((m) => (m.id === msg.id ? res.data : m)));
        setSelected(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Gagal menandai dibaca");
      }
    }
  };

  // Fungsi hapus pesan (memicu custom confirm)
  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Pesan?",
      message: "Pesan ini akan dihapus secara permanen dari kotak masuk.",
      onConfirm: async () => {
        try {
          await api.delete(`/messages/${id}`);
          setItems((prev) => prev.filter((m) => m.id !== id));
          if (selected?.id === id) setSelected(null);
        } catch (err) {
          setError(err.response?.data?.detail || "Gagal menghapus");
        }
        setConfirmModal({ isOpen: false });
      },
    });
  };

  const unreadCount = items.filter((m) => !m.is_read).length;

  return (
    <AdminLayout
      title="Pesan masuk"
      eyebrow="// PESAN MASUK"
      action={
        <label
          className="button outline"
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            style={{ margin: 0 }}
          />
          HANYA BELUM DIBACA
        </label>
      }
    >
      {error && (
        <button className="admin-notice" type="button" onClick={() => setError("")}>
          {error} <span>TUTUP</span>
        </button>
      )}

      <div
        className="admin-panels"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 16 }}
      >
        <section className="admin-panel" style={{ padding: 0, overflow: "hidden" }}>
          <div className="panel-title" style={{ padding: "19px 22px", borderBottom: "1px solid var(--line)" }}>
            <h2>Kotak masuk</h2>
            <span>{unreadCount} BELUM DIBACA</span>
          </div>
          {loading && <p className="muted" style={{ padding: 22 }}>Memuat...</p>}
          {!loading && items.length === 0 && (
            <p className="muted" style={{ padding: 22 }}>
              {unreadOnly ? "Tidak ada pesan belum dibaca." : "Belum ada pesan."}
            </p>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => handleOpen(m)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "14px 22px",
                    borderBottom: "1px solid rgba(232,185,60,0.1)",
                    background: selected?.id === m.id ? "rgba(232,185,60,0.06)" : "transparent",
                    cursor: "pointer",
                    border: 0,
                    borderBottomWidth: 1,
                    borderBottomStyle: "solid",
                    borderBottomColor: "rgba(232,185,60,0.1)",
                    color: "var(--cream)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 12,
                        fontWeight: m.is_read ? 400 : 600,
                        color: m.is_read ? "var(--cream)" : "var(--gold)",
                      }}
                    >
                      {m.name}
                    </strong>
                    {!m.is_read && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--gold)",
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.subject || m.message}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      color: "var(--muted)",
                    }}
                  >
                    {new Date(m.created_at).toLocaleString("id-ID")}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-panel">
          {!selected && (
            <p className="muted">Pilih pesan di sebelah kiri untuk membaca.</p>
          )}
          {selected && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p className="eyebrow">PESAN #{selected.id}</p>
                {/* PERUBAHAN: Jika subjek kosong, tampilkan nama pengirim */}
                <h2 style={{ fontSize: 20, marginBottom: 8 }}>
                  {selected.subject ? selected.subject : `Pesan dari ${selected.name}`}
                </h2>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                  Dari{" "}
                  <strong style={{ color: "var(--cream)" }}>{selected.name}</strong>{" "}
                  &lt;{selected.email}&gt;
                </p>
                <p
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    color: "var(--muted)",
                    marginTop: 4,
                  }}
                >
                  {new Date(selected.created_at).toLocaleString("id-ID")}
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: "var(--cream)",
                    whiteSpace: "pre-wrap",
                    margin: 0,
                  }}
                >
                  {selected.message}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
                {/* PERUBAHAN: Hapus parameter subject jika kosong agar tidak muncul "Re: Pesan Anda" */}
                <a
                  href={`mailto:${selected.email}${
                    selected.subject ? `?subject=Re: ${selected.subject}` : ""
                  }`}
                  className="button primary"
                  style={{ minHeight: 40, padding: "0 18px", fontSize: 11 }}
                >
                  BALAS VIA EMAIL
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(selected.id)}
                  className="button outline"
                  style={{
                    minHeight: 40,
                    padding: "0 18px",
                    fontSize: 11,
                    color: "var(--muted)",
                    borderColor: "rgba(241,235,218,0.22)",
                  }}
                >
                  HAPUS
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

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