import { useEffect } from "react";
import usePageTracking from "../../hooks/usePageTracking";
import Navbar from "../../components/public/Navbar";
import HeroSection from "../../components/public/HeroSection";
import StatsBand from "../../components/public/StatsBand";
import ProjectsSection from "../../components/public/ProjectsSection";
import ExperienceSection from "../../components/public/ExperienceSection";
import SkillsSection from "../../components/public/SkillsSection";
import BackgroundSection from "../../components/public/BackgroundSection";
import ContactSection from "../../components/public/ContactSection";
import Footer from "../../components/public/Footer";

export default function Home() {
  // Lacak kunjungan halaman home ke backend analytics
  usePageTracking("home");

  useEffect(() => {
    // 1. Nonaktifkan scroll restoration bawaan browser saat refresh
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // 2. Jika ada hash anchor di URL (misal #background), hapus agar tidak loncat ke bawah
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    // 3. Kembalikan posisi scroll ke paling atas (Hero Section)
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="site-shell">
      <Navbar />
      <main>
        <HeroSection />
        <StatsBand />
        <ProjectsSection />
        <ExperienceSection />
        <SkillsSection />
        <BackgroundSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}