import { useState, useEffect } from "react";
import api from "../services/api";

export default function useHeroText() {
  const [text, setText] = useState("OPEN TO WORK · INDRAMAYU · WFO / HYBRID");

  useEffect(() => {
    let cancelled = false;
    api.get("/hero-texts/")
      .then(res => {
        if (!cancelled && res.data) {
          const d = res.data;
          setText(`${d.availability} · ${d.location} · ${d.work_type}`);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return text;
}