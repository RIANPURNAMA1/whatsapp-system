import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface LiveReport {
  id: number;
  image_url?: string;
  image_filename?: string;
  extracted_text: string;
  ocr_confidence: number;
  report_title: string;
  report_description: string;
  status: string;
  created_at: string;
  updated_at: string;
  viewers?: string;
  diamonds?: string;
  live_duration?: string;
  gift_givers?: string;
  new_followers?: string;
  comments_count?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    extracted_text: string;
    confidence: number;
    model: string;
  };
}

interface LeadItem {
  remoteJid: string;
  content: string;
  pushName: string;
  lead_source: string;
  session_id: string;
}

interface ConfirmData {
  extracted_text: string;
  ocr_confidence?: number;
  title?: string;
  description?: string;
  viewers?: string;
  diamonds?: string;
  live_duration?: string;
  gift_givers?: string;
  new_followers?: string;
  comments_count?: string;
  leads_data?: LeadItem[] | { total: number; platforms: Record<string, string>; items: LeadItem[] };
}

export const tiktokLiveReportService = {
  /**
   * Upload image and perform OCR
   */
  async uploadImage(
    file: File,
    title?: string,
    description?: string,
    userId?: number
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (userId) formData.append('user_id', userId.toString());

    const response = await api.post<UploadResponse>(
      `/tiktok-live-reports/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Get all TikTok live reports
   */
  async getReports(options?: { page?: number; limit?: number; startDate?: string; endDate?: string }): Promise<{ data: LiveReport[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 10, startDate, endDate } = options || {};
    let url = `/tiktok-live-reports?page=${page}&limit=${limit}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const response = await api.get<{ success: boolean; data: LiveReport[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(url);

    return { data: response.data.data, pagination: response.data.pagination };
  },

  /**
   * Get a specific TikTok live report
   */
  async getReport(id: number, userId?: number): Promise<LiveReport> {
    const response = await api.get<{ success: boolean; data: LiveReport }>(
      `/tiktok-live-reports/${id}`
    );

    return response.data.data;
  },

  /**
   * Update a TikTok live report
   */
  async updateReport(
    id: number,
    data: {
      title?: string;
      description?: string;
      extracted_text?: string;
      notes?: string;
      user_id?: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>(
      `/tiktok-live-reports/${id}`,
      data
    );

    return response.data;
  },

  /**
   * Get all leads from chats/leads-only (all sources)
   */
  async getAllLeads(params?: { startDate?: string; endDate?: string }): Promise<LeadItem[]> {
    let url = `/chats/leads-only`;
    if (params?.startDate) url += `?startDate=${params.startDate}`;
    if (params?.endDate) url += `${params?.startDate ? '&' : '?'}endDate=${params.endDate}`;
    const response = await api.get<{ success: boolean; data: LeadItem[] }>(url);
    return response.data.data || [];
  },

  /**
   * Confirm and save report after user review
   */
  async confirmReport(data: ConfirmData): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await api.post<{ success: boolean; message: string; data: { id: number } }>(
      `/tiktok-live-reports/confirm`,
      data
    );

    return response.data;
  },

  /**
   * Delete a TikTok live report
   */
  async deleteReport(id: number, userId?: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/tiktok-live-reports/${id}`
    );

    return response.data;
  },
};

export default tiktokLiveReportService;
