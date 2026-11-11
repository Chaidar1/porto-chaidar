import { useMemo, useState } from "react";
import useFetch from "../../hooks/useFetch";

const CATEGORY_LABEL = {
  education: "Pendidikan",
  certification: "Sertifikasi",
  organization: "Organisasi",
};

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "education", label: "Pendidikan" },
  { value: "certification", label: "Sertifikasi" },
  { value: "organization", label: "Organisasi" },
];

function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    ""
  );
  return `${base}${url}`;
}

export default function BackgroundSection() {
  const { data: items, loading, error } = useFetch("/backgrounds/");
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const counts = useMemo(() => {
    const acc = { all: (items || []).length };
    (items || []).forEach((it) => {
      acc[it.category] = (acc[it.category] || 0) + 1;
    });
    return acc;
  }, [items]);

  const visible = (items || []).filter(
    (it) => filter === "all" || it.category === filter
  );

  const activeItem = visible.find((it) => it.id === openId) || null;
  const activePhotos = activeItem?.photos || [];

  const openAlbum = (id, index = 0) => {
    setOpenId(id);
    setPhotoIndex(index);
  };

  const closeAlbum = () => {
    setOpenId(null);
    setPhotoIndex(0);
  };

  const movePhoto = (direction) => {
    if (activePhotos.length === 0) return;
    setPhotoIndex(
      (idx) => (idx + direction + activePhotos.length) % activePhotos.length
    );
  };

  // Logika Render Grid Sederhana (Maksimal 3 Slot)
  const renderMosaic = (entry) => {
    const photos = entry.photos || [];
    const total = photos.length;

    if (total === 0) {
      return (
        <div className="album-mosaic album-mosaic-empty">
          <div className="album-tile-placeholder" />
        </div>
      );
    }

    // Siapkan array elemen
    const elements = [];
    const maxRender = 3;

    for (let i = 0; i < maxRender; i++) {
      if (i < total) {
        const photo = photos[i];
        // Jika ini foto ke-3 DAN total foto lebih dari 3
        const isLastAndHasMore = i === 2 && total > 3;

        elements.push(
          <button
            key={photo.id}
            type="button"
            className={`album-tile ${isLastAndHasMore ? "album-tile-more" : ""}`}
            data-more={isLastAndHasMore ? total - 3 : undefined}
            onClick={() => openAlbum(entry.id, i)}
          >
            <img src={resolveImageUrl(photo.image_url)} alt={photo.alt || entry.title} />
            {!isLastAndHasMore && <span>FOTO {String(i + 1).padStart(2, "0")}</span>}
          </button>
        );
      } else {
        // Jika foto belum mencapai 3, isi sisa slot dengan placeholder
        elements.push(
          <div key={`empty-${i}`} className="album-tile-placeholder" />
        );
      }
    }

    return <div className="album-mosaic">{elements}</div>;
  };

  return (
    <section className="section content-wrap" id="background">
      <div className="section-heading split-heading album-heading">
        <div>
          <p className="eyebrow">04 // LATAR BELAKANG</p>
          <h2>Pendidikan, sertifikasi, organisasi.</h2>
          <p className="muted">
            Setiap riwayat dilengkapi album dokumentasi. Klik foto untuk membuka album.
          </p>
        </div>
        <div className="filter-row album-filters" aria-label="Filter latar belakang">
          {FILTERS.map((f) => (
            <button
              className={filter === f.value ? "filter active" : "filter"}
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value);
                closeAlbum();
              }}
            >
              {f.label}
              <span>{counts[f.value] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="muted">Memuat...</p>}
      {error && <p className="muted">Gagal memuat: {error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p className="muted">Belum ada data latar belakang.</p>
      )}

      <div className="album-list">
        {visible.map((entry) => {
          const isOpen = openId === entry.id;
          const hasPhotos = (entry.photos || []).length > 0;

          return (
            <article
              className={`album-card${isOpen ? " is-open" : ""}`}
              key={entry.id}
            >
              <div className="album-summary">
                <p className="eyebrow">
                  {CATEGORY_LABEL[entry.category]?.toUpperCase() || entry.category.toUpperCase()} 
                  {entry.subtitle ? ` · [${entry.subtitle}]` : ""}
                </p>
                <h3>{entry.title}</h3>
                {entry.description && <p>{entry.description}</p>}
                
                {entry.link_url && entry.link_label && (
                  <a
                    href={entry.link_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--gold)",
                      textDecoration: "none",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {entry.link_label}
                  </a>
                )}
                <span className="album-meta">
                  {hasPhotos
                    ? `ALBUM · ${entry.photos.length} FOTO`
                    : "BELUM ADA FOTO"}
                </span>
                {hasPhotos && (
                  <button
                    className="button outline album-open-button"
                    type="button"
                    onClick={() =>
                      isOpen ? closeAlbum() : openAlbum(entry.id, 0)
                    }
                  >
                    {isOpen ? "TUTUP ALBUM" : `BUKA ALBUM · ${entry.photos.length} FOTO`}
                  </button>
                )}
              </div>

              {!isOpen && renderMosaic(entry)}

              {isOpen && activeItem && activePhotos.length > 0 && (
                <div className="album-viewer">
                  <div className="album-stage">
                    <img
                      src={resolveImageUrl(activePhotos[photoIndex].image_url)}
                      alt={activePhotos[photoIndex].alt || activeItem.title}
                    />
                    <span className="photo-count">
                      FOTO {photoIndex + 1} / {activePhotos.length}
                    </span>
                    {activePhotos.length > 1 && (
                      <>
                        <button
                          className="album-arrow previous"
                          type="button"
                          aria-label="Foto sebelumnya"
                          onClick={() => movePhoto(-1)}
                        >
                          ‹
                        </button>
                        <button
                          className="album-arrow next"
                          type="button"
                          aria-label="Foto berikutnya"
                          onClick={() => movePhoto(1)}
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                  <div className="album-detail">
                    <p className="eyebrow">
                      ALBUM · {CATEGORY_LABEL[activeItem.category]?.toUpperCase()}
                    </p>
                    <h4>
                      {activePhotos[photoIndex].caption ||
                        `Foto ${photoIndex + 1} dari ${activePhotos.length}`}
                    </h4>
                    <p className="muted">
                      {activeItem.subtitle || ""}
                      {activeItem.subtitle && activePhotos[photoIndex].credit
                        ? " · "
                        : ""}
                      {activePhotos[photoIndex].credit || ""}
                    </p>
                    <div className="album-thumbnails">
                      {activePhotos.map((photo, index) => (
                        <button
                          className={photoIndex === index ? "active" : ""}
                          type="button"
                          key={photo.id}
                          aria-label={`Pilih foto ${index + 1}`}
                          onClick={() => setPhotoIndex(index)}
                        >
                          <img src={resolveImageUrl(photo.image_url)} alt="" />
                        </button>
                      ))}
                    </div>
                    <button
                      className="button outline close-album"
                      type="button"
                      onClick={closeAlbum}
                    >
                      TUTUP ALBUM
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}