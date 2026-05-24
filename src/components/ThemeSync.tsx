"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("repository-theme");
      if (saved === "light" || saved === "dark") {
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);
  return null;
}
