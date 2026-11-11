import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/useAuth";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.access_token);
      navigate("/admin");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login gagal. Cek username/password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="site-shell"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "min(420px, 100%)" }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link
            to="/"
            className="brand"
            style={{ justifyContent: "center", textDecoration: "none" }}
          >
            <span className="brand-mark">NA</span>
            <span>
              CHAIDAR<span className="accent">_</span>ADMIN
            </span>
          </Link>
        </div>

        {/* Login panel */}
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid rgba(232, 185, 60, 0.4)",
            background: "linear-gradient(135deg, #171309, #0b0b10 62%)",
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <p className="eyebrow">// ADMIN AKSES</p>
            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 26,
                marginTop: 6,
                marginBottom: 6,
                letterSpacing: "-0.02em",
              }}
            >
              Masuk ke panel admin
            </h1>
            <p className="muted" style={{ fontSize: 13 }}>
              Halaman ini hanya untuk administrator.
            </p>
          </div>

          <label
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.06em",
                color: "var(--muted)",
              }}
            >
              USERNAME
            </span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoFocus
              autoComplete="username"
              placeholder="chaidar"
              style={{
                minHeight: 48,
                padding: "12px 14px",
                border: "1px solid rgba(232, 185, 60, 0.28)",
                background: "var(--panel-2)",
                color: "var(--cream)",
                fontSize: 14,
                fontFamily: "var(--font-sans)",
                outline: "none",
              }}
            />
          </label>

          <label
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.06em",
                color: "var(--muted)",
              }}
            >
              PASSWORD
            </span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                minHeight: 48,
                padding: "12px 14px",
                border: "1px solid rgba(232, 185, 60, 0.28)",
                background: "var(--panel-2)",
                color: "var(--cream)",
                fontSize: 14,
                fontFamily: "var(--font-sans)",
                outline: "none",
              }}
            />
          </label>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--gold-bright)",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button primary"
            style={{ width: "100%", marginTop: 4 }}
          >
            {loading ? "MEMPROSES..." : "MASUK →"}
          </button>

          <div
            style={{
              borderTop: "1px solid rgba(232, 185, 60, 0.15)",
              paddingTop: 16,
              textAlign: "center",
            }}
          >
            <Link
              to="/"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              ← KEMBALI KE PORTOFOLIO
            </Link>
          </div>
        </form>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.08em",
            color: "var(--muted)",
          }}
        >
          AKSES ADMIN · HANYA VIA URL
        </p>
      </div>
    </div>
  );
}