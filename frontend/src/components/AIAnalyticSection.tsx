import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Wand2,
  Loader2,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  BrainCircuit,
  MessageSquareShare,
  Check,
  FileDown, // Ikon baru untuk download
} from "lucide-react";

interface AIAnalyticSectionProps {
  stats: any;
  dark: boolean;
}

const AIAnalyticSection: React.FC<AIAnalyticSectionProps> = ({
  stats,
  dark,
}) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Ref untuk menangkap area yang akan dijadikan PDF
  const reportRef = useRef<HTMLDivElement>(null);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/analyze-dashboard`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stats }),
        },
      );

      const json = await res.json();
      if (json.success) {
        setInsight(json.analysis);
      }
    } catch (err) {
      setInsight("Gagal terhubung ke AI Engine. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (insight) {
      navigator.clipboard.writeText(insight);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    try {
      const element = reportRef.current;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        // Gunakan warna HEX murni, hindari variabel CSS
        backgroundColor: dark ? "#202C33" : "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          // SOLUSI KRUSIAL: Hapus semua warna oklch yang menyebabkan crash
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            const style = window.getComputedStyle(el);

            // Jika warna mengandung oklch, paksa jadi HEX/RGB
            if (
              style.color.includes("oklch") ||
              style.backgroundColor.includes("oklch")
            ) {
              el.style.color = dark ? "#E9EDEF" : "#3B4A54";
              if (el.classList.contains("text-[#00a884]")) {
                el.style.color = "#00a884";
              }
            }
          }

          // Pastikan container utama di PDF rapi
          const reportContent = clonedDoc.getElementById("report-content");
          if (reportContent) {
            reportContent.style.backgroundColor = dark ? "#202C33" : "#ffffff";
            reportContent.style.padding = "40px";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SatuPintu-AI-Report.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert(
        "Terjadi kesalahan pada format warna browser. Coba lagi atau gunakan browser lain.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={`mb-8 rounded-2xl border transition-all duration-300 ${
        dark
          ? "bg-[#202C33] border-[#313D45] shadow-xl"
          : "bg-white border-[#E9EDEF] shadow-sm"
      }`}
    >
      {/* Header */}
      <div
        className={`p-5 border-b ${dark ? "border-[#313D45]" : "border-[#E9EDEF]"}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${dark ? "bg-[#2a3942]" : "bg-[#e7fce3]"}`}
            >
              <BrainCircuit className="text-[#00a884]" size={24} />
            </div>
            <div>
              <h3
                className={`text-sm font-black tracking-tight uppercase ${dark ? "text-white" : "text-[#3B4A54]"}`}
              >
                Satu Pintu Business AI
              </h3>
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${dark ? "text-[#8696A0]" : "text-[#667781]"}`}
              >
                Analisis & Strategi Cerdas
              </p>
            </div>
          </div>

          <button
            onClick={generateInsight}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-[11px] font-black transition-all active:scale-95 disabled:opacity-50 ${
              dark
                ? "bg-[#00a884] text-white hover:bg-[#008f70]"
                : "bg-[#e7fce3] text-[#00a884] hover:bg-[#d8f9d3]"
            }`}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wand2 size={16} />
            )}
            {insight ? "PERBARUI ANALISIS" : "ANALISIS HASIL KE AI"}
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#00a884] mb-4" size={40} />
            <p
              className={`text-[11px] font-bold animate-pulse ${dark ? "text-gray-400" : "text-gray-600"}`}
            >
              Menyusun strategi pertumbuhan...
            </p>
          </div>
        )}

        {insight && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Area yang akan didownload */}
            <div
              ref={reportRef}
              className={`p-4 rounded-xl ${dark ? "bg-[#131314]" : "bg-gray-50/50"}`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${dark ? "bg-[#2a3942]" : "bg-[#e7fce3]"}`}
                  >
                    <Sparkles size={16} className="text-[#00a884]" />
                  </div>
                </div>

                <div
                  className={`prose prose-sm max-w-none flex-1 ${dark ? "prose-invert" : ""}`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p
                          className={`text-[13px] leading-relaxed mb-4 ${dark ? "text-gray-300" : "text-[#3B4A54]"}`}
                        >
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-black text-[#00a884]">
                          {children}
                        </strong>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc ml-4 mb-4 space-y-2">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li
                          className={`text-[13px] ${dark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {children}
                        </li>
                      ),
                      h3: ({ children }) => (
                        <h3
                          className={`text-sm font-black mb-2 uppercase tracking-tight ${dark ? "text-white" : "text-[#3B4A54]"}`}
                        >
                          {children}
                        </h3>
                      ),
                    }}
                  >
                    {insight}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Footer & Download Button */}
            <div
              className={`mt-6 pt-4 border-t ${dark ? "border-[#313D45]" : "border-[#E9EDEF]"} flex flex-col md:flex-row gap-4 items-center justify-between`}
            >
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                >
                  {copySuccess ? (
                    <Check size={15} className="text-[#00a884]" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                >
                  <ThumbsUp size={15} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Tombol Download PDF Utama */}
                <button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
                    dark
                      ? "bg-[#2a3942] text-gray-300 hover:bg-[#313D45]"
                      : "bg-white border border-[#E9EDEF] text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {isDownloading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileDown size={14} className="text-[#00a884]" />
                  )}
                  DOWNLOAD LAPORAN PDF
                </button>

                <button
                  className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                >
                  <MessageSquareShare size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalyticSection;
