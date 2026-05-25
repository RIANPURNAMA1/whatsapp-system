import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Users,
  BarChart3,
  Settings,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Plus,
  Reply,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";
import useTikTok from "../../hooks/useLive";

interface TikTokPanelProps {
  onBack?: () => void;
}

type TabType = "comments" | "messages" | "leads" | "rules" | "analytics" | "settings";

const TikTokPanel: React.FC<TikTokPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>("comments");
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ keyword: "", reply: "" });
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const {
    loading,
    comments,
    messages,
    leads,
    rules,
    stats,
    fetchComments,
    replyToComment,
    updateCommentStatus,
    fetchMessages,
    sendMessage,
    fetchLeads,
    updateLeadStatus,
    fetchRules,
    createRule,
    toggleRule,
    deleteRule,
    fetchStats,
  } = useTikTok();

  useEffect(() => {
    switch (activeTab) {
      case "comments":
        fetchComments(1, filterStatus !== "all" ? filterStatus : undefined);
        break;
      case "messages":
        fetchMessages();
        break;
      case "leads":
        fetchLeads();
        break;
      case "rules":
        fetchRules();
        break;
      case "analytics":
        fetchStats();
        break;
    }
  }, [activeTab, filterStatus]);

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Pesan tidak boleh kosong");
      return;
    }

    const result = await replyToComment(selectedComment.id, replyMessage);
    if (result.success) {
      toast.success("Balasan terkirim!");
      setShowReplyModal(false);
      setReplyMessage("");
      setSelectedComment(null);
    } else {
      toast.error(result.error || "Gagal mengirim balasan");
    }
  };

  const handleSendMessage = async (userId: string) => {
    const message = prompt("Masukkan pesan:");
    if (!message?.trim()) return;

    const result = await sendMessage(userId, message);
    if (result.success) {
      toast.success("Pesan terkirim!");
    } else {
      toast.error(result.error || "Gagal mengirim pesan");
    }
  };

  const handleAddRule = async () => {
    if (!newRule.keyword.trim() || !newRule.reply.trim()) {
      toast.error("Keyword dan balasan tidak boleh kosong");
      return;
    }

    const result = await createRule(newRule.keyword, newRule.reply);
    if (result.success) {
      toast.success("Aturan berhasil ditambahkan!");
      setShowAddRuleModal(false);
      setNewRule({ keyword: "", reply: "" });
    } else {
      toast.error(result.error || "Gagal menambah aturan");
    }
  };

  const handleStatusChange = async (commentId: number, status: string) => {
    const result = await updateCommentStatus(commentId, status);
    if (result.success) {
      toast.success("Status diperbarui");
    }
  };

  const handleLeadStatusChange = async (leadId: number, status: string) => {
    const result = await updateLeadStatus(leadId, status);
    if (result.success) {
      toast.success("Status lead diperbarui");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-700";
      case "replied": return "bg-green-100 text-green-700";
      case "contacted": return "bg-yellow-100 text-yellow-700";
      case "qualified": return "bg-purple-100 text-purple-700";
      case "converted": return "bg-emerald-100 text-emerald-700";
      case "spam": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const tabs = [
    { id: "comments" as TabType, label: "Komentar", icon: MessageCircle },
    { id: "messages" as TabType, label: "Pesan", icon: Send },
    { id: "leads" as TabType, label: "Leads", icon: Users },
    { id: "rules" as TabType, label: "Auto Reply", icon: Settings },
    { id: "analytics" as TabType, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
              ←
            </button>
          )}
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="text-gray-900 text-xl font-bold">TikTok</h1>
            <p className="text-gray-500 text-sm">Kelola komentar dan pesan TikTok</p>
          </div>
        </div>
        <button
          onClick={() => fetchComments()}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-rose-500 text-rose-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value="all">Semua</option>
                  <option value="new">Baru</option>
                  <option value="replied">Dibalas</option>
                  <option value="spam">Spam</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Tidak ada komentar
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                        <span className="text-rose-500 font-bold">@</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{comment.username}</p>
                        <p className="text-xs text-gray-500">{comment.username}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comment.status)}`}>
                      {comment.status === "new" ? "Baru" : comment.status === "replied" ? "Dibalas" : comment.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{comment.content}</p>
                  {comment.video_title && (
                    <p className="text-sm text-gray-500 mb-3">Video: {comment.video_title}</p>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {comment.status === "new" && (
                      <button
                        onClick={() => {
                          setSelectedComment(comment);
                          setShowReplyModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600"
                      >
                        <Reply className="w-4 h-4" /> Balas
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(comment.id, "spam")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                    >
                      <XCircle className="w-4 h-4" /> Spam
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Tidak ada pesan
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.direction === "inbound" ? "bg-blue-100" : "bg-green-100"}`}>
                        <Send className={`w-5 h-5 ${msg.direction === "inbound" ? "text-blue-500" : "text-green-500"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{msg.username}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {msg.direction === "inbound" ? "← Masuk" : "→ Keluar"}
                          <Clock className="w-3 h-3" />
                          {new Date(msg.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{msg.message}</p>
                  {msg.direction === "inbound" && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleSendMessage(msg.user_id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600"
                      >
                        <Send className="w-4 h-4" /> Balas
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Tidak ada leads
              </div>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lead.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <select
                      value={lead.status}
                      onChange={(e) => handleLeadStatusChange(lead.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(lead.status)}`}
                    >
                      <option value="new">Baru</option>
                      <option value="contacted">Dihubungi</option>
                      <option value="qualified">Kualifikasi</option>
                      <option value="converted">Konversi</option>
                      <option value="lost">Hilang</option>
                    </select>
                  </div>
                  {lead.message && <p className="text-gray-700">{lead.message}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddRuleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                <Plus className="w-4 h-4" /> Tambah Aturan
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Tidak ada aturan auto-reply
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-sm font-medium">
                          {rule.keyword}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${rule.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {rule.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="text-gray-700">{rule.reply}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`p-2 rounded-lg ${rule.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        {rule.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 text-sm">Total Komentar</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.comments?.total || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 text-sm">Komentar Baru</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.comments?.new_comments || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 text-sm">Total Pesan</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.messages?.total || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 text-sm">Total Leads</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.leads?.total || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 text-sm">Leads Baru</p>
                    <p className="text-2xl font-bold text-green-600">{stats.leads?.new_leads || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 text-sm">Leads Konversi</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.leads?.converted || 0}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg">Balas Komentar</h3>
            </div>
            <div className="p-4">
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">{selectedComment?.content}</p>
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Tulis balasan..."
                className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-rose-500 resize-none"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyMessage("");
                  setSelectedComment(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleReply}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg">Tambah Aturan Auto Reply</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input
                  type="text"
                  value={newRule.keyword}
                  onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
                  placeholder="Contoh: harga, promo"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Balasan Otomatis</label>
                <textarea
                  value={newRule.reply}
                  onChange={(e) => setNewRule({ ...newRule, reply: e.target.value })}
                  placeholder="Tulis balasan otomatis..."
                  className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddRuleModal(false);
                  setNewRule({ keyword: "", reply: "" });
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleAddRule}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TikTokPanel;
