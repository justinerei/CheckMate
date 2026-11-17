"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AdminLiveData } from "./live-data/types";

const LiveData = createContext<{ data: AdminLiveData | null; unavailable: boolean }>({ data: null, unavailable: false });

export function AdminLiveProvider({ overview, children }: { overview: boolean; children: React.ReactNode }) {
  const [data, setData] = useState<AdminLiveData | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;

    async function load() {
      if (document.hidden || fetching) return;
      fetching = true;
      try {
        const response = await fetch(`/admin/live-data?overview=${overview ? 1 : 0}`, {
          cache: "no-store", signal: controller.signal,
        });
        if (response.status === 401 && !controller.signal.aborted) setData(null);
        if (!response.ok) throw new Error("Live updates unavailable");
        const snapshot: AdminLiveData = await response.json();
        if (controller.signal.aborted) return;
        setData(snapshot);
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      } finally {
        fetching = false;
      }
    }

    void load();
    const interval = window.setInterval(load, 15_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", load);
    };
  }, [overview]);

  return <LiveData.Provider value={{ data, unavailable }}>{children}</LiveData.Provider>;
}

export function useAdminLiveData() {
  return useContext(LiveData);
}
