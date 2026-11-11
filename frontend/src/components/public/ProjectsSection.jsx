import { useState } from "react";
import useFetch from "../../hooks/useFetch";

const CATEGORIES = [
  { value: "all", label: "Semua" },
  { value: "fullstack", label: "Fullstack" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
];

const CATEGORY_LABEL = {
  fullstack: "FULLSTACK",
  frontend: "FRONTEND",
  backend: "BACKEND",
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

export default function ProjectsSection() {
  const { data: projects, loading, error } = useFetch("/projects/");
  const [filter, setFilter] = useState("all");

  const visible = (projects || []).filter(
    (p) => p.is_published && (filter === "all" || p.category === filter)
  );

  return (
    <section className="section content-wrap" id="projects">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">01 // PROJECT UNGGULAN</p>
          <h2>Bukti, bukan klaim.</h2>
        </div>
        <div className="filter-row" aria-label="Filter project">
          {CATEGORIES.map((c) => (
            <button
              className={filter === c.value ? "filter active" : "filter"}
              key={c.value}
              type="button"
              onClick={() => setFilter(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="muted">Memuat projects...</p>}
      {error && <p className="muted">Gagal memuat: {error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p className="muted">Belum ada project.</p>
      )}

      <div className="project-grid">
        {visible.map((p, idx) => (
          <article className="project-card" key={p.id}>
            <div className="project-visual">
              <div className="window-dots">
                <i />
                <i />
                <i />
              </div>
              {p.image_url ? (
                <img src={resolveImageUrl(p.image_url)} alt={p.title} />
              ) : (
                <div className="visual-ui">
                  <span />
                  <span />
                  <span />
                  <b>
                    [ PRODUCT INTERFACE /{" "}
                    {CATEGORY_LABEL[p.category] || "WEB"} ]
                  </b>
                </div>
              )}
            </div>
            <div className="project-info">
              <p className="eyebrow">
                {String(idx + 1).padStart(2, "0")} ·{" "}
                {p.is_featured
                  ? "FEATURED"
                  : CATEGORY_LABEL[p.category] || "PROJECT"}
              </p>
              <h3>{p.title}</h3>
              {p.description && <p className="muted">{p.description}</p>}
              {p.slug && <p className="project-role">/{p.slug}</p>}
              {p.tech_stack?.length > 0 && (
                <div className="tag-row">
                  {p.tech_stack.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="card-links">
                {p.demo_url && (
                  <a href={p.demo_url} target="_blank" rel="noreferrer">
                    LIVE DEMO ↗
                  </a>
                )}
                {p.repo_url && (
                  <a href={p.repo_url} target="_blank" rel="noreferrer">
                    REPOSITORY ↗
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}