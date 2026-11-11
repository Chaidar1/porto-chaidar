import useFetch from "../../hooks/useFetch";

const LABELS = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  tools: "Tools",
};

export default function SkillsSection() {
  const { data: skills, loading, error } = useFetch("/skills/");

  const grouped = (skills || []).reduce((acc, s) => {
    const cat = s.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <section className="section content-wrap" id="skills">
      <div className="section-heading">
        <p className="eyebrow">03 // TECH STACK</p>
        <h2>Perangkat yang dikuasai.</h2>
      </div>

      {loading && <p className="muted">Memuat skills...</p>}
      {error && <p className="muted">Gagal memuat: {error}</p>}
      {!loading && !error && Object.keys(grouped).length === 0 && (
        <p className="muted">Belum ada skill.</p>
      )}

      <div className="skill-grid">
        {Object.entries(grouped).map(([cat, items], idx) => (
          <article className="skill-card" key={cat}>
            <p className="eyebrow">
              {String(idx + 1).padStart(2, "0")} /{" "}
              {(LABELS[cat] || cat).toUpperCase()}
            </p>
            <div className="tag-row">
              {items.map((s) => (
                <span className="tag" key={s.id}>
                  {s.name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}