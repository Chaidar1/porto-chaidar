import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

const PLATFORMS = [
  { id: "github", label: "GITHUB URL", placeholder: "https://github.com/username" },
  { id: "linkedin", label: "LINKEDIN URL", placeholder: "https://linkedin.com/in/username" },
  { id: "email", label: "EMAIL LINK", placeholder: "mailto:email@domain.com" },
];

export default function ManageSocials() {
  const [links, setLinks] = useState({ github: "", linkedin: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.get("/socials/")
      .then((res) => {
        if (!cancelled) {
          const map = { github: "", linkedin: "", email: "" };
          res.data.forEach((item) => { map[item.platform] = item.url; });
          setLinks(map);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat link.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => setLinks(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (platform) => {
    setNotice("");
    setError("");
    
    let finalUrl = links[platform].trim();

    // Jika platform email, validasi dan pastikan ada 'mailto:'
    if (platform === "email") {
      if (finalUrl && !finalUrl.startsWith("mailto:") && finalUrl.includes("@")) {
        finalUrl = `mailto:${finalUrl}`;
        // Update state agar input di layar langsung berubah menampilkan 'mailto:'
        setLinks(prev => ({ ...prev, email: finalUrl }));
      }
    }

    try {
      await api.put(`/socials/${platform}`, { url: finalUrl });
      setNotice(`Link ${platform.toUpperCase()} diperbarui.`);
    } catch {
      setError(`Gagal menyimpan ${platform}.`);
    }
  };

  return (
    <AdminLayout
      title="Pengaturan Media Sosial"
      eyebrow="// TAUTAN KONTAK"
    >
      {error && <button className="admin-notice" onClick={() => setError("")}>{error} <span>TUTUP</span></button>}
      {notice && <button className="admin-notice" onClick={() => setNotice("")}>{notice} <span>TUTUP</span></button>}

      <div className="admin-panel" style={{ maxWidth: 600 }}>
        <div className="panel-title">
          <h2>Tautan Profil</h2>
        </div>
        <p className="muted" style={{ marginBottom: 20 }}>
          Tautan ini akan otomatis terpasang pada tombol di Hero Section dan Contact Section.
        </p>

        {loading ? <p className="muted">Memuat...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PLATFORMS.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{p.label}</span>
                  <input
                    name={p.id}
                    value={links[p.id]}
                    onChange={handleChange}
                    placeholder={p.placeholder}
                    style={{ 
                      width: "100%", 
                      marginTop: 4, 
                      padding: 10, 
                      background: "var(--panel-2)", 
                      border: "1px solid var(--line)", 
                      color: "var(--cream)" 
                    }}
                  />
                </label>
                <button
                  className="button primary"
                  style={{ minHeight: 42 }}
                  onClick={() => handleSave(p.id)}
                >
                  SIMPAN
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}