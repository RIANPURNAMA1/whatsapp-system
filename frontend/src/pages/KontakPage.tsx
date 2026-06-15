import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Loader2,
  RefreshCcw,
  Smartphone,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Avatar from "../components/Avatar";
import { contactApi } from "../services/api";
import useStore from "../store/useStore";

const pageSize = 20;

const KontakPage: React.FC = () => {
  const { sessions } = useStore();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState("all");
  const [page, setPage] = useState(1);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (selectedSession && selectedSession !== "all") {
        const data = await contactApi.getAll(selectedSession, search);
        setContacts(data || []);
      } else {
        if (sessions.length === 0) {
          setContacts([]);
          return;
        }
        const results = await Promise.all(
          sessions.map((s: any) => contactApi.getAll(s.id, search))
        );
        setContacts(results.flat());
      }
    } catch (err: any) {
      console.error("Gagal memuat kontak:", err);
      setError(err?.response?.data?.message || err?.message || "Gagal memuat kontak");
    } finally {
      setLoading(false);
    }
  }, [selectedSession, search, sessions.length]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedSession]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.push_name || "").toLowerCase().includes(q) ||
        (c.phone_number || "").includes(q) ||
        (c.jid || "").toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const paginatedData = filteredContacts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const getContactName = (c: any) =>
    c.name || c.push_name || c.phone_number || c.jid?.split("@")[0] || "Unknown";

  return (
    <div className="h-full flex flex-col bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E6EB] px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#E7F3FF]">
            <Users size={18} className="text-[#1877F2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#050505]">Kontak</h1>
            <p className="text-[11px] text-[#65676B]">
              Daftar kontak tersinkron dari perangkat WhatsApp
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C939D]"
            />
            <input
              type="text"
              placeholder="Cari nama atau nomor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg text-xs border border-[#CCD0D5] bg-[#F0F2F5] outline-none text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white transition-all"
            />
          </div>

          <div className="relative w-full sm:w-44">
            <Smartphone
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C939D] pointer-events-none"
            />
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full h-9 pl-8 pr-8 rounded-lg text-xs outline-none appearance-none cursor-pointer border border-[#CCD0D5] bg-[#F0F2F5] text-[#050505]"
            >
              <option value="all">Semua Perangkat</option>
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchContacts}
            className="h-9 px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="animate-spin w-7 h-7 text-[#1877F2]" />
            <p className="text-xs text-[#65676B] mt-3">Memuat kontak...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-sm font-medium text-[#65676B]">Gagal memuat kontak</p>
            <p className="text-xs text-[#8C939D] mt-1 max-w-xs text-center">{error}</p>
            <button
              onClick={fetchContacts}
              className="mt-4 h-8 px-4 rounded-lg text-xs font-semibold bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#F0F2F5] flex items-center justify-center mb-3">
              <Users size={28} className="text-[#BCC0C4]" />
            </div>
            <p className="text-sm font-medium text-[#65676B]">
              {search
                ? "Kontak tidak ditemukan"
                : sessions.length === 0
                ? "Tidak ada perangkat terhubung"
                : "Belum ada kontak"}
            </p>
            <p className="text-xs text-[#65676B] mt-1">
              {search
                ? "Coba gunakan kata kunci lain"
                : sessions.length === 0
                ? "Hubungkan perangkat WhatsApp terlebih dahulu"
                : "Kontak akan muncul setelah tersinkron dari perangkat"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E4E6EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F0F2F5]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#65676B] border-b border-[#E4E6EB]">
                      Nama
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#65676B] border-b border-[#E4E6EB]">
                      Nomor
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#65676B] border-b border-[#E4E6EB] hidden sm:table-cell">
                      Push Name
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#65676B] border-b border-[#E4E6EB] hidden md:table-cell">
                      JID
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#65676B] border-b border-[#E4E6EB] hidden lg:table-cell">
                      Perangkat
                    </th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#65676B] border-b border-[#E4E6EB] w-20">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E6EB]">
                  {paginatedData.map((contact) => {
                    const name = getContactName(contact);
                    const phone = contact.phone_number
                      ? `+${contact.phone_number}`
                      : contact.jid?.split("@")[0] || "-";
                    const sessionName =
                      sessions.find((s: any) => s.id === contact.session_id)
                        ?.name || contact.session_id;

                    return (
                      <tr
                        key={contact.id || contact.jid}
                        className="hover:bg-[#F5F6F8] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={name}
                              imageUrl={contact.profile_pic_url}
                              size="sm"
                              isGroup={false}
                              className="w-[34px] h-[34px] shrink-0"
                            />
                            <span className="text-[13px] font-semibold text-[#050505] truncate max-w-[180px]">
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#65676B] font-mono">
                            {phone}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-[#65676B] truncate max-w-[150px] block">
                            {contact.push_name || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[10px] text-[#8C939D] font-mono truncate max-w-[200px] block">
                            {contact.jid}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-[#65676B]">
                            {sessionName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {contact.is_business === 1 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E7F3FF] text-[#1877F2]">
                              Business
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#BCC0C4]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredContacts.length > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E4E6EB]">
                <span className="text-xs text-[#65676B]">
                  {pageSize * (page - 1) + 1}–
                  {Math.min(pageSize * page, filteredContacts.length)} dari{" "}
                  {filteredContacts.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E6EB] text-[#65676B] disabled:opacity-40 hover:bg-[#F2F3F5] transition-all flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-7 h-7 text-xs font-medium rounded-lg transition-all"
                        style={
                          p === page
                            ? { backgroundColor: "#1877F2", color: "#fff" }
                            : { color: "#65676B" }
                        }
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E6EB] text-[#65676B] disabled:opacity-40 hover:bg-[#F2F3F5] transition-all flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && contacts.length > 0 && filteredContacts.length <= pageSize && (
          <div className="mt-4 text-center text-[11px] text-[#65676B]">
            Total {filteredContacts.length} kontak
            {selectedSession === "all" && sessions.length > 1
              ? ` (dari ${sessions.length} perangkat)`
              : ""}
          </div>
        )}
      </div>
    </div>
  );
};

export default KontakPage;
