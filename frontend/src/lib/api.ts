import axios from 'axios';

// API Base URL - adjust this based on your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const donationRequestsAPI = {
  // Get all donation requests (public)
  getAll: (params?: any) => api.get('/donation-requests', { params }),

  // Get single donation request (public)
  getById: (id: string) => api.get(`/donation-requests/${id}`),

  // Get categories (public)
  getCategories: () => api.get('/donation-requests/categories'),

  // Get organizer's own requests (protected)
  getMyRequests: () => api.get('/donation-requests/my/requests'),

  // Create new donation request (protected)
  create: (data: any) => api.post('/donation-requests', data),

  // Update donation request (protected)
  update: (id: string, data: any) => api.put(`/donation-requests/${id}`, data),

  // Delete donation request (protected)
  delete: (id: string) => api.delete(`/donation-requests/${id}`),
};

// --- Favorites (รายการที่สนใจ) ---
export type FavoriteRequestItem = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  location: string;
  goal_amount: number;
  current_amount: number;
  goalAmount?: number;
  currentAmount?: number;
  supporters: number;
  image?: string | null;
  images?: unknown;
  organizer: string | null;
  daysLeft?: number | null;
  status?: string;
};

export const favoritesAPI = {
  getList: () => api.get<{ data: FavoriteRequestItem[] }>('/me/favorites'),
  add: (requestId: string) => api.post('/me/favorites', { request_id: requestId }),
  remove: (requestId: string) => api.delete(`/me/favorites/${requestId}`),
};

export const itemDonationsAPI = {
  submit: (data: {
    donation_request_id: string
    items_needed: string
    estimated_value: number
    evidence_images: string[]
    delivery_method?: string
    delivery_date?: string
    delivery_time?: string
    tracking_number?: string
    message?: string
  }) => api.post('/item-donations', data),
};

// --- Donation history (profile) ---
export type DonationHistoryProject = { id: string; title: string };

export type DonationHistoryEntryMoney = {
  id: string;
  history_type: 'money';
  date: string;
  project: DonationHistoryProject | null;
  amount: number;
  payment_method: string;
  slip_url: string | null;
  status: string;
};

export type DonationHistoryEntryItem = {
  id: string;
  history_type: 'item';
  date: string;
  project: DonationHistoryProject | null;
  evidence_images: string[];
  items_needed: string;
  estimated_value?: number;
  status: string;
};

export type DonationHistoryEntryVolunteer = {
  id: string;
  history_type: 'volunteer';
  date: string;
  project: DonationHistoryProject | null;
  status: string;
  message?: string;
  estimated_hours?: number;
  skills?: string;
  approved_at?: string;
  completed_at?: string;
};

export type DonationHistoryEntry =
  | DonationHistoryEntryMoney
  | DonationHistoryEntryItem
  | DonationHistoryEntryVolunteer;

export type DonationHistoryResponse = {
  data: DonationHistoryEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export const donationHistoryAPI = {
  getHistory: (params?: {
    type?: 'money' | 'item' | 'volunteer';
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }) => api.get<DonationHistoryResponse>('/me/donation-history', { params }),
};

export const volunteerApplicationsAPI = {
  submit: (data: {
    donation_request_id: string
    message?: string
    skills: string[]
    skill_details?: string
    experience?: string
    available_dates: string[]
    preferred_time?: string
    duration?: string
    estimated_hours?: number
    volunteer_phone?: string
    volunteer_email?: string
    age?: number
    emergency_contact?: string
    emergency_phone?: string
    has_vehicle?: boolean
    vehicle_type?: string
  }) => api.post('/volunteer-applications', data),
};

export const trustAPI = {
  getMyTrust: () =>
    api.get<{
      donorTrustLevel: number
      donorTrustLevelName: string
      donorTrustScore: number
      donorNextLevelPoints: number
      donorNextLevelName: string | null
      donorProgress: number
      donorIsMaxLevel: boolean
      organizerTrustLevel: number
      organizerTrustLevelName: string
      organizerTrustScore: number
      organizerNextLevelPoints: number
      organizerNextLevelName: string | null
      organizerProgress: number
      organizerIsMaxLevel: boolean
    }>('/me/trust'),
  getTrustLevels: () =>
    api.get<{
      donor: Array<{ level: number; name: string; min_score: number }>
      organizer: Array<{ level: number; name: string; min_score: number }>
    }>('/trust-levels'),
  getOrganizerTrust: (userId: string) =>
    api.get<{
      userId: string
      organizerTrustLevel: number
      organizerTrustLevelName: string
    }>(`/users/${userId}/trust`),
};

export const pointsAPI = {
  getMyPoints: () => api.get<{
    userId: string
    totalPoints: number
    availablePoints: number
    level: number
    levelName: string
    nextLevelPoints: number
    donorTrustLevel?: number
    donorTrustLevelName?: string
    organizerTrustLevel?: number
    organizerTrustLevelName?: string
    pointsHistory: Array<{
      id: string
      type: string
      amount: number
      source: string
      description: string
      date: string
      relatedId?: string
    }>
  }>('/points'),
  spend: (data: { amount: number; source: string; description: string; relatedId?: string }) =>
    api.post('/points/spend', {
      amount: data.amount,
      source: data.source,
      description: data.description,
      related_id: data.relatedId,
    }),
};

export const organizerApprovalAPI = {
  getPendingItemDonations: () => api.get('/organizer/item-donations/pending'),
  approveItemDonation: (id: string) => api.post(`/organizer/item-donations/${id}/approve`),
  rejectItemDonation: (id: string) => api.post(`/organizer/item-donations/${id}/reject`),
  getPendingVolunteerApplications: () => api.get('/organizer/volunteer-applications/pending'),
  approveVolunteerApplication: (id: string, actual_hours: number) => api.post(`/organizer/volunteer-applications/${id}/approve`, { actual_hours }),
  rejectVolunteerApplication: (id: string) => api.post(`/organizer/volunteer-applications/${id}/reject`),
};

export type TrustLevelRow = { level: number; name: string; min_score: number };

export const adminTrustLevelsAPI = {
  getLevels: () =>
    api.get<{ donor: TrustLevelRow[]; organizer: TrustLevelRow[] }>('/admin/trust-levels'),
  updateLevels: (data: { donor: TrustLevelRow[]; organizer: TrustLevelRow[] }) =>
    api.put('/admin/trust-levels', data),
};

export type RewardAdminItem = {
  id: string
  name: string
  description: string
  category: string
  pointsCost: number
  image: string | null
  isActive: boolean
  isLimited: boolean
  limitQuantity?: number
  remainingQuantity?: number
  requirements?: Record<string, unknown>
  createdBy: string
  createdAt: string
};

export const adminRewardsAPI = {
  getList: () => api.get<RewardAdminItem[]>('/admin/rewards'),
  uploadRewardImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<{ success: boolean; url: string; message: string }>('/upload/reward-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: (body: {
    id?: string
    profileType?: 'theme' | 'badge' | 'frame' | 'title'
    name: string
    description?: string
    category: string
    pointsCost: number
    image?: string
    isActive?: boolean
    isLimited?: boolean
    limitQuantity?: number
    remainingQuantity?: number
    requirements?: Record<string, unknown>
  }) => api.post('/admin/rewards', body),
  update: (id: string, body: Partial<RewardAdminItem>) => api.put(`/admin/rewards/${id}`, body),
  delete: (id: string) => api.delete(`/admin/rewards/${id}`),
};

export type UserRewardFromAPI = {
  id: string;
  rewardId: string;
  isActive: boolean;
  purchasedAt: string | null;
};

export const rewardsAPI = {
  getList: () => api.get<RewardAdminItem[]>('/rewards'),
  getMyRewards: () => api.get<UserRewardFromAPI[]>('/me/rewards'),
  redeem: (rewardId: string) =>
    api.post<{ success: boolean; availablePoints: number; message: string }>('/rewards/redeem', {
      reward_id: rewardId,
    }),
};
