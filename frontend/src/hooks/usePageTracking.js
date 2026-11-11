/**
 * usePageTracking — catat kunjungan halaman ke backend analytics.
 *
 * Strategi deduplication:
 *   - sessionStorage key "pv_<page>" → hanya satu ping per sesi browser.
 *   - Ini mencegah double-count saat komponen re-render atau HMR reload.
 */
import { useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function usePageTracking(page = "home") {
  useEffect(() => {
    const storageKey = `pv_${page}`;

    // Sudah tercatat pada sesi ini → skip
    if (sessionStorage.getItem(storageKey)) return;

    // Tandai sesi ini sebelum fetch (hindari race-condition double request)
    sessionStorage.setItem(storageKey, "1");

    fetch(`${BASE_URL}/api/analytics/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page }),
    }).catch(() => {
      // Jika gagal (server mati, rate-limit, dsb.) → hapus flag agar bisa
      // dicoba lagi pada refresh berikutnya, tapi JANGAN lempar error ke UI.
      sessionStorage.removeItem(storageKey);
    });
  }, [page]);
}

