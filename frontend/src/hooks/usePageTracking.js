/**
 * usePageTracking — catat kunjungan halaman ke backend analytics.
 *
 * Strategi deduplication:
 *   - sessionStorage key "pv_<page>" → hanya satu ping per sesi browser.
 *   - Ini mencegah double-count saat komponen re-render atau HMR reload.
 */
import { useEffect } from "react";
import api from "../services/api";

export default function usePageTracking(page = "home") {
  useEffect(() => {
    const storageKey = `pv_${page}`;

    // Sudah tercatat pada sesi ini → skip
    if (sessionStorage.getItem(storageKey)) return;

    // Tandai sesi ini sebelum request (hindari race-condition double request)
    sessionStorage.setItem(storageKey, "1");

    api.post("/analytics/ping", { page }).catch(() => {
      // Jika gagal (server offline, rate-limit, dsb.) → hapus flag agar bisa
      // dicoba lagi pada refresh berikutnya, tapi JANGAN lempar error ke UI.
      sessionStorage.removeItem(storageKey);
    });
  }, [page]);
}

