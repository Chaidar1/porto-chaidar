import { useState } from "react";
import api from "../../services/api";
import useSocials from "../../hooks/useSocials";

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  
  const socials = useSocials();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api.post("/messages/", {
        name: form.name,
        email: form.email,
        message: form.message,
        subject: null,
      });
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => setSent(false), 6000);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  // Fungsi bantu untuk memformat label teks (opsional)
  const formatLabel = (url, prefix, fallback) => {
    if (!url || url === "#") return fallback;
    if (prefix && url.includes(prefix)) {
      return url.replace(prefix, "");
    }
    return url.replace("mailto:", "").replace("https://", "");
  };

  return (
    <section className="section contact-section content-wrap" id="contact">
      <div className="contact-panel">
        <div className="contact-copy">
          <p className="eyebrow">05 // KONTAK</p>
          <h2>Mari bangun sesuatu bersama.</h2>
          <p className="muted">
            Siap untuk kesempatan full-time, kontrak, maupun kolaborasi produk
            di Jakarta dan sekitarnya.
          </p>
          
          {/* Bagian yang diubah: menggunakan data dari socials */}
          <div className="contact-links">
            <a href={socials.email}>
              EMAIL · {formatLabel(socials.email, "mailto:", "email@domain.com")}
            </a>
            <a href={socials.linkedin} target="_blank" rel="noreferrer">
              LINKEDIN · {formatLabel(socials.linkedin, "linkedin.com/in/", "/in/username")}
            </a>
            <a href={socials.github} target="_blank" rel="noreferrer">
              GITHUB · {formatLabel(socials.github, "github.com/", "/username")}
            </a>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            <span>NAMA</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nama Anda"
              required
              minLength={2}
            />
          </label>
          <label>
            <span>EMAIL</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="nama@perusahaan.com"
              required
            />
          </label>
          <label>
            <span>PESAN</span>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              placeholder="Tulis pesan atau detail posisi"
              required
              minLength={5}
            />
          </label>
          <button className="button primary" type="submit" disabled={sending}>
            {sending ? "MENGIRIM..." : "KIRIM PESAN"}
          </button>
          {sent && <p className="form-success">PESAN TERSIMPAN · TERIMA KASIH</p>}
          {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}
        </form>
      </div>
    </section>
  );
}