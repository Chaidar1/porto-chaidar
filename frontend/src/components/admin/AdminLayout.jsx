import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const MENU = [
  { label: "Ringkasan", to: "/admin" },
  { label: "Project", to: "/admin/projects" },
  { label: "Pengalaman", to: "/admin/experiences" },
  { label: "Skill", to: "/admin/skills" },
  { label: "Latar belakang", to: "/admin/backgrounds" },
  { label: "Stats", to: "/admin/stats" },
  { label: "Media Sosial", to: "/admin/socials" },
  { label: "Pesan masuk", to: "/admin/messages" },
];

export default function AdminLayout({ title, eyebrow = "// ADMIN", action, children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="brand">
          <span className="brand-mark">NA</span>
          <span>
            CHAIDAR<span className="accent">_</span>ADMIN
          </span>
        </Link>

        <nav>
          {MENU.map((item) => (
            <button
              key={item.to}
              type="button"
              className={pathname === item.to ? "active" : ""}
              onClick={() => navigate(item.to)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-account">
          <strong>Chaidar</strong>
          <span>admin · sesi aman</span>
          <button type="button" onClick={handleLogout}>
            KELUAR ↗
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}