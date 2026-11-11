import { useState } from "react";
import useResume from "../../hooks/useResume";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const cvUrl = useResume();

  const links = [
    ["PROJECT", "#projects"],
    ["PENGALAMAN", "#experience"],
    ["SKILL", "#skills"],
    ["LATAR", "#background"],
    ["KONTAK", "#contact"],
  ];

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <a href="#top" onClick={() => setOpen(false)}>
          <div className="brand">
            <span className="brand-mark">MCA</span>
            <span>
              MUHAMMAD_CHAIDAR<span className="accent">_</span>ALI
            </span>
          </div>
        </a>

        <button
          className="menu-button"
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? "TUTUP" : "MENU"}
        </button>

        <nav className={open ? "main-nav is-open" : "main-nav"}>
          {links.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>

        <a 
          className="button primary nav-cta" 
          href={cvUrl} 
          target="_blank" 
          rel="noreferrer" 
          download
        >
          UNDUH CV
        </a>
      </div>
    </header>
  );
}