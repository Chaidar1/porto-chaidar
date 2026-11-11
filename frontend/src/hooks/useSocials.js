// src/hooks/useSocials.js
import { useState, useEffect } from "react";
import api from "../services/api";

export default function useSocials() {
  const [socials, setSocials] = useState({
    github: "#",
    linkedin: "#",
    email: "#",
  });

  useEffect(() => {
    let cancelled = false;
    api.get("/socials/")
      .then(res => {
        if (cancelled) return;
        const map = { github: "#", linkedin: "#", email: "#" };
        res.data.forEach(item => { map[item.platform] = item.url; });
        setSocials(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return socials;
}