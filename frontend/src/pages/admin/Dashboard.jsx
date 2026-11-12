import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import HeroPhotoModal from "../../components/admin/HeroPhotoModal";
import ResumeUploadModal from "../../components/admin/ResumeUploadModal";

// ---------------------------------------------------------------------------
// Komponen SVG Chart — render polyline dari data harian analytics
// ---------------------------------------------------------------------------
const SVG_W = 640;
const SVG_H = 210;
const PAD_T = 20;  // padding atas (agar titik tertinggi tidak terpotong)
const PAD_B = 10;  // padding bawah
const CHART_H = SVG_H - PAD_T - PAD_B; // 180

function VisitorChart({ data, loading }) {
  if (loading) {
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Memuat data">
        <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fill="var(--muted)" fontSize="13" fontFamily="var(--font-mono)">
          Memuat data…
        </text>
      </svg>
    );
  }

  if (!data || data.length === 0) {
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Belum ada data">
        <g className="chart-grid">
          <path d={`M0 ${PAD_T + CHART_H * 0.25}H${SVG_W}M0 ${PAD_T + CHART_H * 0.5}H${SVG_W}M0 ${PAD_T + CHART_H * 0.75}H${SVG_W}M0 ${PAD_T + CHART_H}H${SVG_W}`} />
        </g>
        <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fill="var(--muted)" fontSize="13" fontFamily="var(--font-mono)">
          Belum ada data kunjungan
        </text>
      </svg>
    );
  }

  const n = data.length;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Konversi data → koordinat SVG
  const pts = data.map((d, i) => {
    const x = n === 1 ? SVG_W / 2 : (i / (n - 1)) * SVG_W;
    const y = PAD_T + CHART_H - (d.count / maxCount) * CHART_H;
    return { x, y, ...d };
  });

  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");
  const areaD = `${lineD}V${SVG_H}H0Z`;

  // Grid lines (4 baris horizontal)
  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => {
    const gy = PAD_T + CHART_H * f;
    return `M0 ${gy.toFixed(1)}H${SVG_W}`;
  }).join("");

  // Titik aktif = hari terakhir (hari ini)
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Grafik kunjungan harian">
      {/* Grid */}
      <g className="chart-grid">
        <path d={gridLines} />
      </g>

      {/* Area fill */}
      <path className="chart-area" d={areaD} />

      {/* Garis utama */}
      <path className="chart-line" d={lineD} />

      {/* Tooltip titik per hari */}
      {pts.map((p) => (
        <g key={p.date}>
          <title>{p.date}: {p.count} kunjungan</title>
          <circle
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r={p === last ? 5 : 3}
            fill={p === last ? "var(--gold)" : "var(--chart-line, var(--gold))"}
            opacity={p === last ? 1 : 0.5}
          />
        </g>
      ))}

      {/* Label count hari ini */}
      {last.count > 0 && (
        <text
          x={Math.min(last.x + 8, SVG_W - 40)}
          y={Math.max(last.y - 8, PAD_T + 4)}
          fill="var(--gold)"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {last.count}
        </text>
      )}
    </svg>
  );
}

export default function Dashboard() {
  const { data: projects } = useFetch("/projects/");
  const { data: messages } = useFetch("/messages/", []);
  const { data: skills } = useFetch("/skills/");
  const { data: experiences } = useFetch("/experiences/");

  const [showHeroModal, setShowHeroModal] = useState(false);
  const [heroPhoto, setHeroPhoto] = useState(null);

  // State untuk CV
  const [showCvModal, setShowCvModal] = useState(false);
  const [cvUrl, setCvUrl] = useState(null);

  // State untuk Hero Text (Status)
  const [statusData, setStatusData] = useState({
    availability: "OPEN TO WORK",
    location: "INDRAMAYU",
    work_type: "WFO / HYBRID",
  });
  const [showStatusModal, setShowStatusModal] = useState(false);

  // State untuk Notifikasi (Pengganti Alert)
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // State untuk Custom Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // --- State Analytics Chart ---
  const [chartDays, setChartDays] = useState(7);
  const [analytics, setAnalytics] = useState(null);
  // loading dimulai true agar skeleton tampil saat pertama kali
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Fetch data saat mount
  useEffect(() => {
    let cancelled = false;

    api.get("/hero/")
      .then((res) => { if (!cancelled) setHeroPhoto(res.data); })
      .catch(() => { if (!cancelled) setHeroPhoto(null); });

    api.get("/resume/")
      .then((res) => {
        if (!cancelled) setCvUrl(res.data?.file_url || null);
      })
      .catch(() => { if (!cancelled) setCvUrl(null); });

    api.get("/hero-texts/")
      .then((res) => {
        if (!cancelled && res.data) setStatusData(res.data);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  // Ambil analytics saat mount dan saat chartDays berubah
  useEffect(() => {
    let cancelled = false;
    api
      .get(`/analytics/views?days=${chartDays}`)
      .then((res) => {
        if (!cancelled) {
          setAnalytics(res.data);
          setAnalyticsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnalytics(null);
          setAnalyticsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [chartDays]);

  const refreshHero = async () => {
    try {
      const res = await api.get("/hero/");
      setHeroPhoto(res.data);
    } catch { setHeroPhoto(null); }
  };

  const refreshCv = async () => {
    try {
      const res = await api.get("/resume/");
      setCvUrl(res.data?.file_url || null);
    } catch { setCvUrl(null); }
  };

  const handleDeleteCv = () => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus CV?",
      message: "CV yang diunggah akan dihapus secara permanen. Pengunjung tidak akan bisa mengunduh CV sampai Anda mengunggahnya lagi.",
      onConfirm: async () => {
        try {
          await api.delete("/resume/");
          setCvUrl(null);
          setNotice("CV berhasil dihapus.");
        } catch (err) {
          setError(err.response?.data?.detail || "Gagal menghapus CV");
        }
        setConfirmModal({ isOpen: false });
      },
    });
  };

  const saveStatusData = async () => {
    setError("");
    setNotice("");
    try {
      await api.put("/hero-texts/", statusData);
      setShowStatusModal(false);
      setNotice("Status ketersediaan berhasil diperbarui.");
    } catch {
      setError("Gagal menyimpan status.");
    }
  };

  const totalProjects = projects?.length || 0;
  const published = (projects || []).filter((p) => p.is_published).length;
  const drafts = totalProjects - published;

  const totalMessages = messages?.length || 0;
  const unread = (messages || []).filter((m) => !m.is_read).length;

  const totalSkills = skills?.length || 0;
  const totalExperiences = experiences?.length || 0;

  // Card statistik — card "KUNJUNGAN 7 HARI" sudah dihapus
  // karena data kunjungan sudah cukup diwakili oleh line chart di bawah.
  const cards = [
    ["PROJECT PUBLIK", String(published), `${drafts} draft · ${totalProjects} total`],
    ["PESAN MASUK", String(totalMessages), `${unread} belum dibaca`],
    ["SKILL TERDAFTAR", String(totalSkills), "di semua kategori"],
    ["PENGALAMAN", String(totalExperiences), "riwayat kerja"],
  ];

  const recentProjects = (projects || []).slice(0, 4);
  const recentMessages = (messages || []).slice(0, 3);

  return (
    <AdminLayout
      title="Pusat kendali portofolio"
      eyebrow="// RINGKASAN"
      action={
        <Link to="/admin/projects" className="button primary" style={{ minHeight: 36, padding: "0 16px", fontSize: 11 }}>
          + TAMBAH PROJECT
        </Link>
      }
    >
      {/* Tampilkan Notifikasi (Menimpa alert) */}
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

      {/* --- TOOLBAR HORIZONTAL (Di atas Statistik) --- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--panel)",
          border: "1px solid var(--line)",
          padding: "16px 20px",
          overflowX: "auto",
          width: "100%",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--muted)",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
            marginRight: 8,
          }}
        >
          PENGATURAN CEPAT:
        </span>

        {/* Grup Tombol CV */}
        {cvUrl ? (
          <div style={{ display: "flex", gap: 8, flex: 1 }}>
            <button
              type="button"
              className="button outline"
              style={{ flex: 1, minHeight: 44, fontSize: 12, padding: "0 16px" }}
              onClick={() => setShowCvModal(true)}
            >
              UPDATE CV
            </button>
            <button
              type="button"
              className="button outline"
              style={{
                flex: 1,
                minHeight: 44,
                fontSize: 12,
                padding: "0 16px",
                borderColor: "rgba(255,100,100,0.4)",
                color: "#ff8888",
              }}
              onClick={handleDeleteCv}
            >
              HAPUS CV
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="button outline"
            style={{ flex: 1, minHeight: 44, fontSize: 12, padding: "0 16px", whiteSpace: "nowrap" }}
            onClick={() => setShowCvModal(true)}
          >
            + UPLOAD CV
          </button>
        )}

        {/* Tombol Hero */}
        <button
          type="button"
          className="button outline"
          style={{ flex: 1, minHeight: 44, fontSize: 12, padding: "0 16px", whiteSpace: "nowrap" }}
          onClick={() => setShowHeroModal(true)}
        >
          {heroPhoto ? "GANTI FOTO HERO" : "+ TAMBAH FOTO HERO"}
        </button>

        {/* Tombol Edit Status */}
        <button
          type="button"
          className="button outline"
          style={{ flex: 1, minHeight: 44, fontSize: 12, padding: "0 16px", whiteSpace: "nowrap" }}
          onClick={() => setShowStatusModal(true)}
        >
          EDIT STATUS
        </button>
      </div>

      {/* --- KONTEN STATISTIK --- */}
      <div className="admin-stats">
        {cards.map(([label, value, note]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>

      <div className="admin-panels">
        <section className="chart-panel admin-panel">
          <div className="panel-title">
            <h2>Kunjungan Portfolio</h2>
            {/* Toggle 7 / 30 hari */}
            <div style={{ display: "flex", gap: 6 }}>
              {[7, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setChartDays(d)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    padding: "3px 10px",
                    border: "1px solid var(--line)",
                    background: chartDays === d ? "var(--gold)" : "transparent",
                    color: chartDays === d ? "#000" : "var(--muted)",
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                  }}
                >
                  {d} HARI
                </button>
              ))}
            </div>
          </div>

          {/* Label ringkasan di atas chart */}
          <div style={{ display: "flex", gap: 24, padding: "0 4px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>
            <span style={{ color: "var(--muted)" }}>
              HARI INI:{" "}
              <strong style={{ color: "var(--cream)" }}>
                {analyticsLoading ? "…" : (analytics?.today ?? 0)}
              </strong>
            </span>
            <span style={{ color: "var(--muted)" }}>
              TOTAL {chartDays} HARI:{" "}
              <strong style={{ color: "var(--gold)" }}>
                {analyticsLoading
                  ? "…"
                  : (chartDays === 7 ? analytics?.total_7d : analytics?.total_30d) ?? 0}
              </strong>
            </span>
          </div>

          {/* SVG Chart */}
          <VisitorChart
            data={chartDays === 7 ? analytics?.daily_7d : analytics?.daily_30d}
            loading={analyticsLoading}
          />
        </section>

        <section className="activity-panel admin-panel">
          <h2>Ringkasan cepat</h2>
          <div className="activity-item">
            <i />
            <span>
              <strong>{published} project publik</strong>
              <small>+ {drafts} draft</small>
            </span>
          </div>
          <div className="activity-item">
            <i />
            <span>
              <strong>{unread} pesan belum dibaca</strong>
              <small>dari {totalMessages} pesan masuk</small>
            </span>
          </div>
          <div className="activity-item">
            <i />
            <span>
              <strong>{totalSkills} skill</strong>
              <small>{totalExperiences} pengalaman kerja</small>
            </span>
          </div>
        </section>
      </div>

      <section className="admin-panel project-table-panel">
        <div className="panel-title">
          <h2>Project terbaru</h2>
          <Link to="/admin/projects" style={{ color: "var(--gold)", fontSize: 10 }}>
            LIHAT SEMUA ↗
          </Link>
        </div>
        <div className="project-table">
          <div className="table-row table-head">
            <span>JUDUL</span>
            <span>SLUG</span>
            <span>STATUS</span>
            <span>FEATURED</span>
          </div>
          {recentProjects.length === 0 && (
            <div className="table-row">
              <strong style={{ color: "var(--muted)" }}>Belum ada project.</strong>
              <span />
              <span />
              <span />
            </div>
          )}
          {recentProjects.map((p) => (
            <div className="table-row" key={p.id}>
              <strong>{p.title}</strong>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                {p.slug}
              </span>
              <span className={p.is_published ? "status public" : "status"}>
                {p.is_published ? "PUBLIK" : "DRAFT"}
              </span>
              <span
                style={{
                  color: p.is_featured ? "var(--gold)" : "var(--muted)",
                  fontSize: 10,
                }}
              >
                {p.is_featured ? "YA" : "TIDAK"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel message-panel">
        <div className="panel-title">
          <h2>Pesan terbaru</h2>
          <Link to="/admin/messages" style={{ color: "var(--gold)", fontSize: 10 }}>
            LIHAT SEMUA ↗
          </Link>
        </div>
        {recentMessages.length === 0 && (
          <div className="message-row">
            <span>
              <strong style={{ color: "var(--muted)" }}>
                Belum ada pesan masuk.
              </strong>
            </span>
            <p />
            <small />
          </div>
        )}
        {recentMessages.map((m) => (
          <div className="message-row" key={m.id}>
            <span>
              <strong>{m.name}</strong>
              <small>{m.email}</small>
            </span>
            <p>
              {m.message.slice(0, 80)}
              {m.message.length > 80 ? "..." : ""}
            </p>
            <small>
              {new Date(m.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </small>
          </div>
        ))}
      </section>

      {/* Modals */}
      {showHeroModal && (
        <HeroPhotoModal
          current={heroPhoto}
          onClose={() => setShowHeroModal(false)}
          onChanged={refreshHero}
        />
      )}

      {showCvModal && (
        <ResumeUploadModal
          currentUrl={cvUrl}
          onClose={() => setShowCvModal(false)}
          onChanged={refreshCv}
        />
      )}

      {showStatusModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowStatusModal(false)}>
          <div className="project-modal" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <p className="eyebrow">// EDIT STATUS HERO</p>
            <h2>Ubah Status Ketersediaan</h2>
            
            <label>
              <span>STATUS</span>
              <select 
                value={statusData.availability} 
                onChange={(e) => setStatusData({...statusData, availability: e.target.value})}
                style={{ width: "100%", padding: 10, background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--cream)" }}
              >
                <option value="OPEN TO WORK">OPEN TO WORK</option>
                <option value="AVAILABLE FOR FREELANCE">AVAILABLE FOR FREELANCE</option>
                <option value="NOT AVAILABLE">NOT AVAILABLE</option>
                <option value="INTERNSHIP HUNTER">INTERNSHIP HUNTER</option>
              </select>
            </label>

            <label>
              <span>LOKASI</span>
              <select 
                value={statusData.location} 
                onChange={(e) => setStatusData({...statusData, location: e.target.value})}
                style={{ width: "100%", padding: 10, background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--cream)" }}
              >
                <option value="INDRAMAYU">INDRAMAYU</option>
                <option value="JAKARTA">JAKARTA</option>
                <option value="BANDUNG">BANDUNG</option>
                <option value="REMOTE">REMOTE</option>
              </select>
            </label>

            <label>
              <span>TIPE KERJA</span>
              <select 
                value={statusData.work_type} 
                onChange={(e) => setStatusData({...statusData, work_type: e.target.value})}
                style={{ width: "100%", padding: 10, background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--cream)" }}
              >
                <option value="WFO / HYBRID">WFO / HYBRID</option>
                <option value="FULL REMOTE">FULL REMOTE</option>
                <option value="WFO">WFO (ON-SITE)</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </label>

            <div className="button-row" style={{ marginTop: 12 }}>
              <button className="button primary" onClick={saveStatusData}>
                SIMPAN
              </button>
              <button className="button outline" onClick={() => setShowStatusModal(false)}>
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal (Hapus CV) */}
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