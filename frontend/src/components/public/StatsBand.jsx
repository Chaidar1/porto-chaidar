import useFetch from "../../hooks/useFetch";

export default function StatsBand() {
  const { data: stats, loading, error } = useFetch("/stats/");

  // Skeleton fallback: kalau loading/error, tetap tampilkan struktur dengan "—"
  const items = stats && stats.length > 0 ? stats : [];

  return (
    <section className="stats-band">
      <div className="stats content-wrap">
        {loading && items.length === 0 && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div className="stat" key={i}>
                <strong style={{ opacity: 0.3 }}>—</strong>
                <span style={{ opacity: 0.3 }}>MEMUAT...</span>
              </div>
            ))}
          </>
        )}

        {!loading && error && (
          <div className="stat" style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: "var(--muted)" }}>Stats belum tersedia.</span>
          </div>
        )}

        {!loading &&
          !error &&
          items.map((s) => (
            <div className="stat" key={s.id}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}

        {!loading && !error && items.length === 0 && (
          <div className="stat" style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: "var(--muted)" }}>Belum ada stat.</span>
          </div>
        )}
      </div>
    </section>
  );
}