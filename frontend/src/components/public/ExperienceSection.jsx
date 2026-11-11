import useFetch from "../../hooks/useFetch";

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

export default function ExperienceSection() {
  const { data: items, loading, error } = useFetch("/experiences/");

  return (
    <section className="section content-wrap experience" id="experience">
      <div className="section-heading sticky-heading">
        <p className="eyebrow">02 // PENGALAMAN</p>
        <h2>Jejak kerja.</h2>
        <p className="muted">
          Pengalaman membangun produk bersama tim yang bergerak cepat.
        </p>
      </div>

      <div className="experience-list">
        {loading && <p className="muted">Memuat pengalaman...</p>}
        {error && <p className="muted">Gagal memuat: {error}</p>}
        {!loading && !error && (items || []).length === 0 && (
          <p className="muted">Belum ada pengalaman.</p>
        )}

        {(items || []).map((exp) => (
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
          </article>
        ))}
      </div>
    </section>
  );
}