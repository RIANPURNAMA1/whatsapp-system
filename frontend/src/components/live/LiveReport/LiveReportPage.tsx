import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Eye, Edit2, Save, X, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import tiktokLiveReportService from '../../../services/liveReportService';

interface LiveReport {
  id: number;
  image_url?: string;
  extracted_text: string;
  ocr_confidence: number;
  report_title: string;
  report_description: string;
  status: string;
  created_at: string;
  viewers?: string;
  diamonds?: string;
  live_duration?: string;
  gift_givers?: string;
  new_followers?: string;
  comments_count?: string;
  leads_data?: any;
}

interface EditingReport {
  id: number;
  title: string;
  description: string;
  text: string;
}

interface OcrResult {
  extracted_text: string;
  confidence: number;
  model: string;
}

interface ParsedData {
  tayangan: string;
  berlian: string;
  durasi_live: string;
  pemberi_hadiah: string;
  pengikut_baru: string;
  komentar: string;
}

function getLeadsTotal(data: any): number {
  try {
    const d = typeof data === 'string' ? JSON.parse(data) : data;
    if (!d) return 0;
    if (typeof d.total === 'number') return d.total;
    if (Array.isArray(d)) return d.length;
    return 0;
  } catch { return 0; }
}

function getLeadsPlatforms(data: any): Record<string, string> | null {
  try {
    const d = typeof data === 'string' ? JSON.parse(data) : data;
    if (d && d.platforms && typeof d.platforms === 'object') return d.platforms;
    return null;
  } catch { return null; }
}

function parseOcrText(text: string): ParsedData {
  const empty: ParsedData = {
    tayangan: '',
    berlian: '',
    durasi_live: '',
    pemberi_hadiah: '',
    pengikut_baru: '',
    komentar: '',
  };

  try {
    const jsonMatch = text.match(/\{[\s\S]*"tayangan"[\s\S]*"komentar"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        tayangan: parsed.tayangan || '',
        berlian: parsed.berlian || '',
        durasi_live: parsed.durasi_live || '',
        pemberi_hadiah: parsed.pemberi_hadiah || '',
        pengikut_baru: parsed.pengikut_baru || '',
        komentar: parsed.komentar || '',
      };
    }
  } catch {}

  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/(tayangan|viewers|penonton)/i.test(lower)) {
      const val = line.replace(/[^0-9.,kKbBmM]/g, '').trim();
      if (val) empty.tayangan = val;
    }
    if (/(berlian|diamond|diamon)/i.test(lower)) {
      const val = line.replace(/[^0-9.,kKbBmM]/g, '').trim();
      if (val) empty.berlian = val;
    }
    if (/(durasi|duration|lama\s*live)/i.test(lower)) {
      const val = line.replace(/.*?(durasi|duration|lama\s*live)\s*:?\s*/i, '').trim();
      if (val) empty.durasi_live = val;
    }
    if (/(pemberi\s*hadi?ah|gift|gift\s*giver|pengirim)/i.test(lower)) {
      const val = line.replace(/[^0-9.,kKbBmM]/g, '').trim();
      if (val) empty.pemberi_hadiah = val;
    }
    if (/(pengikut\s*baru|new\s*follower|follower\s*baru)/i.test(lower)) {
      const val = line.replace(/[^0-9.,kKbBmM]/g, '').trim();
      if (val) empty.pengikut_baru = val;
    }
    if (/(komentar|comment|komen)/i.test(lower)) {
      const val = line.replace(/[^0-9.,kKbBmM]/g, '').trim();
      if (val) empty.komentar = val;
    }
  }

  return empty;
}

const TikTokLiveReportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reports, setReports] = useState<LiveReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(todayStr);
  const [editingReport, setEditingReport] = useState<EditingReport | null>(null);
  const [selectedReport, setSelectedReport] = useState<LiveReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [tiktokLeads, setTiktokLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [totalLeadsEdit, setTotalLeadsEdit] = useState("0");
  const [platformSources, setPlatformSources] = useState<Record<string, string>>({});
  const [parsedData, setParsedData] = useState<ParsedData>({
    tayangan: '',
    berlian: '',
    durasi_live: '',
    pemberi_hadiah: '',
    pengikut_baru: '',
    komentar: '',
  });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    loadReports();
  }, [page]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const result = await tiktokLiveReportService.getReports({ page, limit });
      setReports(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Hanya file gambar yang diizinkan');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar (max 10MB)');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Pilih gambar terlebih dahulu');
      return;
    }
    if (!title.trim()) {
      toast.error('Judul laporan tidak boleh kosong');
      return;
    }

    try {
      setUploading(true);
      const response = await tiktokLiveReportService.uploadImage(file, title, description);

      if (response.success) {
        const result = response.data;
        setOcrResult(result);

        const parsed = parseOcrText(result.extracted_text);
        setParsedData(parsed);

        setLoadingLeads(true);
        try {
          const leads = await tiktokLiveReportService.getAllLeads({
            startDate: reportDate,
            endDate: `${reportDate} 23:59:59`,
          });
          setTiktokLeads(leads);
          setTotalLeadsEdit(leads.length.toString());
          const groups: Record<string, number> = {};
          leads.forEach((l: any) => {
            const src = l.lead_source || 'Unknown';
            groups[src] = (groups[src] || 0) + 1;
          });
          const platInputs: Record<string, string> = {};
          Object.entries(groups).forEach(([k, v]) => { platInputs[k] = v.toString(); });
          setPlatformSources(platInputs);
        } catch (e) {
          console.error('Error fetching TikTok leads:', e);
        } finally {
          setLoadingLeads(false);
        }

        toast.success('OCR selesai, silakan periksa data');
      } else {
        toast.error(response.message || 'Gagal memproses gambar');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Gagal memproses gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!ocrResult) return;

    try {
      setSaving(true);
      await tiktokLiveReportService.confirmReport({
        extracted_text: ocrResult.extracted_text,
        ocr_confidence: ocrResult.confidence,
        title,
        description,
        viewers: parsedData.tayangan,
        diamonds: parsedData.berlian,
        live_duration: parsedData.durasi_live,
        gift_givers: parsedData.pemberi_hadiah,
        new_followers: parsedData.pengikut_baru,
        comments_count: parsedData.komentar,
        leads_data: { total: parseInt(totalLeadsEdit) || 0, platforms: platformSources, date: reportDate, items: tiktokLeads },
      });

      toast.success('Laporan berhasil disimpan!');
      setOcrResult(null);
      setTiktokLeads([]);
      setPlatformSources({});
      setFile(null);
      setPreview(null);
      setTitle('');
      setDescription('');
      setReportDate(todayStr);
      await loadReports();
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan laporan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus laporan ini?')) {
      return;
    }
    try {
      await tiktokLiveReportService.deleteReport(id);
      toast.success('Laporan berhasil dihapus');
      setReports(reports.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Gagal menghapus laporan');
    }
  };

  const handleEditReport = (report: LiveReport) => {
    setEditingReport({
      id: report.id,
      title: report.report_title,
      description: report.report_description || '',
      text: report.extracted_text,
    });
    setShowEditModal(true);
  };

  const handleSaveReport = async () => {
    if (!editingReport) return;
    try {
      await tiktokLiveReportService.updateReport(editingReport.id, {
        title: editingReport.title,
        description: editingReport.description,
        extracted_text: editingReport.text,
      });
      toast.success('Laporan berhasil diperbarui');
      setShowEditModal(false);
      setEditingReport(null);
      await loadReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Gagal memperbarui laporan');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EE1D52" }}>
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Buat Laporan Live</h1>
          </div>
          <p className="text-sm text-slate-500">
            Upload screenshot hasil live, baca teks otomatis dengan AI, periksa data, dan simpan laporan
          </p>
        </div>

        {/* Upload + Review Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5" style={{ color: "#EE1D52" }} />
                Upload Gambar Hasil Live
              </h2>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {preview ? (
                  <div className="space-y-4">
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                      className="text-sm text-red-600 hover:text-red-700">
                      Ubah gambar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-base font-medium text-slate-900">Drag & drop gambar di sini</p>
                      <p className="text-sm text-slate-500 mt-1">atau klik untuk memilih file</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Format: JPG, PNG, WebP, GIF (max 10MB)</p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Judul Laporan *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Laporan Live 21 Mei 2024"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan (Opsional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tambahkan catatan tentang live ini..." rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Laporan</label>
                  <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm" />
                </div>
              </div>

              <button onClick={handleUpload} disabled={!file || !title || uploading}
                className={`w-full mt-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  !file || !title || uploading
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95'
                }`}>
                {uploading ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Memproses OCR...</>
                ) : (
                  <><Upload className="w-5 h-5" /> Upload & Ekstrak Data</>
                )}
              </button>
            </div>
          </div>

          {/* Review Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {!ocrResult ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Data Hasil Ekstrak</h3>
                <div className="text-sm text-slate-500 p-5 bg-slate-50 rounded-lg text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Upload gambar dan klik "Upload & Ekstrak Data" untuk memulai
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Data Hasil Ekstrak</h3>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    Akurasi: {Math.round(ocrResult.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500">Periksa dan perbaiki jika ada yang kurang sesuai</p>

                <div className="space-y-3">
                  {[
                    { label: 'Tayangan', key: 'tayangan', placeholder: 'Contoh: 1.2K' },
                    { label: 'Berlian', key: 'berlian', placeholder: 'Contoh: 500' },
                    { label: 'Durasi Live', key: 'durasi_live', placeholder: 'Contoh: 1:30:00' },
                    { label: 'Pemberi Hadiah', key: 'pemberi_hadiah', placeholder: 'Contoh: 10' },
                    { label: 'Pengikut Baru', key: 'pengikut_baru', placeholder: 'Contoh: 50' },
                    { label: 'Komentar', key: 'komentar', placeholder: 'Contoh: 200' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                      <input type="text"
                        value={(parsedData as any)[field.key]}
                        onChange={(e) => setParsedData({ ...parsedData, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </div>
                  ))}
                </div>

                {!loadingLeads && (
                  <div className="border-t border-slate-200 pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Leads dari Live</h4>
                    <div className="bg-rose-50 rounded-lg p-4 border border-rose-200 flex items-center justify-between">
                      <p className="text-sm text-rose-700">Total Leads</p>
                      <input type="number" min="0"
                        value={totalLeadsEdit}
                        onChange={(e) => setTotalLeadsEdit(e.target.value)}
                        className="w-24 text-2xl font-bold text-rose-600 bg-transparent border-b-2 border-rose-300 text-right focus:outline-none focus:border-rose-600" />
                    </div>
                    {parseInt(totalLeadsEdit) > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        {totalLeadsEdit} leads akan otomatis disertakan dalam laporan.
                      </p>
                    )}

                    {Object.keys(platformSources).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2">Platform Sources</h4>
                        <div className="space-y-1.5">
                          {Object.entries(platformSources).map(([source, count]) => (
                            <div key={source} className="flex items-center justify-between bg-slate-50 rounded px-3 py-1.5">
                              <span className="text-xs text-slate-600 capitalize">{source}</span>
                              <input type="number" min="0"
                                value={count}
                                onChange={(e) => setPlatformSources({ ...platformSources, [source]: e.target.value })}
                                className="w-16 text-sm font-semibold text-slate-800 bg-transparent border-b border-slate-300 text-right focus:outline-none focus:border-blue-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button onClick={handleConfirmSave} disabled={saving}
                  className={`w-full mt-3 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    saving ? 'bg-emerald-400 text-white cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                  }`}>
                  {saving ? <><Loader className="w-5 h-5 animate-spin" /> Menyimpan...</> : <><Save className="w-5 h-5" /> Simpan Laporan</>}
                </button>

                <button onClick={() => { setOcrResult(null); setTiktokLeads([]); setPlatformSources({}); setFile(null); setPreview(null); setTitle(''); setDescription(''); setReportDate(todayStr); }}
                  className="w-full py-2 rounded-lg font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all text-sm">
                  Batal & Upload Ulang
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Daftar Laporan</h2>
            {!loading && reports.length > 0 && (
              <span className="text-xs text-slate-500">
                Halaman {page} dari {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: "#EE1D52" }} />
              <p className="text-slate-500 text-sm">Memuat laporan...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 text-sm">Belum ada laporan</p>
              <p className="text-xs text-slate-400 mt-1">Upload gambar hasil live Anda untuk membuat laporan pertama</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Judul', 'Tayangan', 'Berlian', 'Durasi', 'Hadiah', 'Pengikut', 'Komentar', 'Leads', 'Tanggal', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-xs text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{report.report_title}</p>
                        {report.report_description && (
                          <p className="text-xs text-slate-500 mt-0.5">{report.report_description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-blue-600">{report.viewers || '-'}</td>
                      <td className="px-4 py-3 text-purple-600">{report.diamonds || '-'}</td>
                      <td className="px-4 py-3 text-cyan-600">{report.live_duration || '-'}</td>
                      <td className="px-4 py-3 text-amber-600">{report.gift_givers || '-'}</td>
                      <td className="px-4 py-3 text-emerald-600">{report.new_followers || '-'}</td>
                      <td className="px-4 py-3 text-rose-600">{report.comments_count || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {getLeadsTotal(report.leads_data) || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(report.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => { setSelectedReport(report); setShowModal(true); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditReport(report)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteReport(report.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <span className="text-sm text-slate-500">
                {reports.length > 0 ? `${(page - 1) * limit + 1}-${Math.min(page * limit, (page - 1) * limit + reports.length)} dari ${((page - 1) * limit + reports.length) + (totalPages - page) * limit}` : '0'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`p-2 rounded-lg transition-colors ${page <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`p-2 rounded-lg transition-colors ${page >= totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{selectedReport.report_title}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedReport.report_description && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Keterangan</h3>
                  <p className="text-slate-600">{selectedReport.report_description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Tayangan', value: selectedReport.viewers, bg: "bg-blue-50", text: "text-blue-600" },
                  { label: 'Berlian', value: selectedReport.diamonds, bg: "bg-purple-50", text: "text-purple-600" },
                  { label: 'Durasi Live', value: selectedReport.live_duration, bg: "bg-cyan-50", text: "text-cyan-600" },
                  { label: 'Pemberi Hadiah', value: selectedReport.gift_givers, bg: "bg-amber-50", text: "text-amber-600" },
                  { label: 'Pengikut Baru', value: selectedReport.new_followers, bg: "bg-emerald-50", text: "text-emerald-600" },
                  { label: 'Komentar', value: selectedReport.comments_count, bg: "bg-rose-50", text: "text-rose-600" },
                  { label: 'Leads', value: getLeadsTotal(selectedReport.leads_data) || '-', bg: "bg-red-50", text: "text-red-600" },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} rounded-lg p-4 border`}>
                    <p className={`text-xs font-medium ${item.text}`}>{item.label}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{item.value || '-'}</p>
                  </div>
                ))}
              </div>

              {(() => {
                const platforms = getLeadsPlatforms(selectedReport.leads_data);
                return platforms ? (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Platform Sources</h3>
                    <div className="space-y-2">
                      {Object.entries(platforms).map(([src, cnt]) => (
                        <div key={src} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 capitalize">{src}</span>
                          <span className="text-sm font-semibold text-slate-800">{cnt} leads</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Teks Terekstrak (Akurasi: {Math.round(selectedReport.ocr_confidence * 100)}%)
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-slate-700 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {selectedReport.extracted_text}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm text-slate-600">
                <p>Dibuat: {formatDate(selectedReport.created_at)}</p>
                <p className="mt-1">Status: {selectedReport.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Edit Laporan</h2>
              <button onClick={() => { setShowEditModal(false); setEditingReport(null); }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Judul Laporan</label>
                <input type="text" value={editingReport.title}
                  onChange={(e) => setEditingReport({ ...editingReport, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan</label>
                <textarea value={editingReport.description}
                  onChange={(e) => setEditingReport({ ...editingReport, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teks Terekstrak</label>
                <textarea value={editingReport.text}
                  onChange={(e) => setEditingReport({ ...editingReport, text: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-sm" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveReport}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Simpan Perubahan
                </button>
                <button onClick={() => { setShowEditModal(false); setEditingReport(null); }}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition-all">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TikTokLiveReportPage;