import { useState, useEffect } from "react";
import api from "../services/api";

export default function useResume() {
  const [cvUrl, setCvUrl] = useState("#");

  useEffect(() => {
    let cancelled = false;
    api.get("/resume/")
      .then(res => {
        if (cancelled) return;
        if (res.data && res.data.file_url) {
          const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
          setCvUrl(`${base}${res.data.file_url}`);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return cvUrl;
}