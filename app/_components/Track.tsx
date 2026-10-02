"use client";

import { useEffect } from "react";

export default function Track({ path }: { path: string }) {
  useEffect(() => {
    try {
      const key = "prastav_v_" + path;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    let vid = "";
    try {
      vid = localStorage.getItem("prastav_vid") || "";
      if (!vid) {
        vid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("prastav_vid", vid);
      }
    } catch {}
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, visitor: vid }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [path]);
  return null;
}
