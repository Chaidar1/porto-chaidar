import useFetch from "../../hooks/useFetch";
import useSocials from "../../hooks/useSocials";
import useResume from "../../hooks/useResume";
import useHeroText from "../../hooks/useHeroText";

function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    ""
  );
  return `${base}${url}`;
}

export default function HeroSection() {
  const { data: heroPhoto } = useFetch("/hero/");
  const socials = useSocials();
  const cvUrl = useResume();
  const statusText = useHeroText();

  return (
    <section className="hero content-wrap" id="top">
      <div className="hero-copy">
        <div className="status-chip">
          <span className="status-dot" />
          {statusText}
        </div>
        <p className="eyebrow">// HALO, SAYA CHAIDAR</p>
        <h1>
          Fullstack Developer Website <span>end-to-end</span>.
        </h1>
        <p className="hero-lead">
          Saya mengubah ide menjadi produk digital yang cepat, terukur, dan
          siap berkembang bersama bisnis Anda.
        </p>
        
        <div className="button-row">
          <a 
            className="button primary" 
            href={cvUrl} 
            target="_blank" 
            rel="noreferrer" 
            download
          >
            UNDUH CV
          </a>
          <a className="button outline" href="#projects">
            LIHAT PROJECT
          </a>
        </div>
        
        <div className="social-links">
          <a href={socials.github} target="_blank" rel="noreferrer">
            GITHUB ↗
          </a>
          <a href={socials.linkedin} target="_blank" rel="noreferrer">
            LINKEDIN ↗
          </a>
          <a href={socials.email}>EMAIL ↗</a>
        </div>
      </div>

      <div className="profile-column">
        <div className="profile-frame">
          <span className="corner top-left" />
          <span className="corner top-right" />
          <span className="corner bottom-left" />
          <span className="corner bottom-right" />
          <div className="profile-card">
            <div className="profile-topline">
              <span>PROFILE.SYS</span>
              <span className="online">
                <i /> ONLINE
              </span>
            </div>
            <div className="portrait" aria-label="Foto profil">
              {heroPhoto?.image_url ? (
                <img
                  src={resolveImageUrl(heroPhoto.image_url)}
                  alt="Foto Chaidar"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: `${heroPhoto.position_x ?? 50}% ${
                      heroPhoto.position_y ?? 50
                    }%`,
                  }}
                />
              ) : (
                <>
                  <div className="portrait-head" />
                  <div className="portrait-body" />
                </>
              )}
              <div className="scanlines" />
            </div>
            <div className="profile-caption">
              <strong>CHAIDAR</strong>
              <span>FULLSTACK WEB DEVELOPER</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}