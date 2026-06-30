import React, { useState, useEffect, useCallback } from "react";
import { Tag } from "lucide-react";
import LabelSection from "../components/LabelSection";

const LabelsPage: React.FC = () => {
  const [allLabels, setAllLabels] = useState<any[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [labelDeviceFilter, setLabelDeviceFilter] = useState("all");

  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const res = await fetch(`${baseApi}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setSessions(json.data || []);
    } catch (err) {
      console.error("Fetch sessions error:", err);
    }
  }, []);

  const fetchAllLabels = useCallback(async () => {
    setLoadingLabels(true);
    try {
      const token = localStorage.getItem("token");
      const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const res = await fetch(`${baseApi}/labels/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAllLabels(json.data || []);
          setLoadingLabels(false);
          return;
        }
      }
      if (sessions.length > 0) {
        const allFetched: any[] = [];
        await Promise.all(sessions.map(async (session: any) => {
          const r = await fetch(`${baseApi}/sessions/${session.id}/labels`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = await r.json();
          if (d.success) allFetched.push(...(d.data || []).map((l: any) => ({ ...l, sessionName: session.name, session_id: session.id })));
        }));
        setAllLabels(allFetched);
      }
    } catch (err) {
      console.error("Fetch labels error:", err);
    } finally {
      setLoadingLabels(false);
    }
  }, [sessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (sessions.length > 0) fetchAllLabels();
  }, [sessions.length, fetchAllLabels]);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#0866FF]">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#050505]">Labels</h1>
              <p className="text-xs text-[#65676B]">Sembunyikan label yang tidak penting</p>
            </div>
          </div>
        </div>

        <LabelSection
          isDarkMode={false}
          loadingLabels={loadingLabels}
          allLabels={allLabels}
          sessions={sessions}
          labelDeviceFilter={labelDeviceFilter}
          setLabelDeviceFilter={setLabelDeviceFilter}
        />
      </div>
    </div>
  );
};

export default LabelsPage;
