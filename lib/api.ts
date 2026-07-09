import axios from 'axios';
import Cookies from 'js-cookie';

const LOCAL_API_URL = 'http://localhost:5000/api';
const PRODUCTION_API_URL = 'https://rsgalaxybackend.onrender.com/api';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : LOCAL_API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = Cookies.get('rs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors
api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

// ── AUTH ──
// ── AUTH ──
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data).then(r => r.data),

  me: () => api.get('/auth/me').then(r => r.data),

  // 🆕 Password management
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }).then(r => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  verifyOTP: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }).then(r => r.data),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword }).then(r => r.data),

  updateProfile: (data: any) => api.put('/auth/me', data).then(r => r.data),
  deleteMyData: () => api.delete('/auth/data').then(r => r.data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  uploadId: (file: File) => {
    const formData = new FormData();
    formData.append('idDocument', file);
    return api.post('/auth/upload-id', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

// ── SAVED CARDS ──
export const savedCardAPI = {
  getAll: () => api.get('/saved-cards').then(r => r.data),
  create: (data: any) => api.post('/saved-cards', data).then(r => r.data),
  delete: (id: string) => api.delete(`/saved-cards/${id}`).then(r => r.data),
};

// ── HOTELS ──
export const hotelAPI = {
  getAll: (params?: any) => api.get('/hotels', { params }).then(r => r.data),
  getDeleted: () => api.get('/hotels/deleted').then(r => r.data),
  getOne: (id: string) => api.get(`/hotels/${id}`).then(r => r.data),
  create: (data: any) => api.post('/hotels', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/hotels/${id}`, data).then(r => r.data),
  bulkUpdateStatus: (ids: string[], status: string) => api.put('/hotels/bulk-status', { ids, status }).then(r => r.data),
  delete: (id: string) => api.delete(`/hotels/${id}`).then(r => r.data),
  restore: (id: string) => api.put(`/hotels/${id}/restore`, {}).then(r => r.data),
  hardDelete: (id: string) => api.delete(`/hotels/${id}/permanent`).then(r => r.data),
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return api.post('/hotels/upload-images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

// ── AUDIT LOGS ──
export const auditAPI = {
  getForEntity: (entityType: string, entityId: string) =>
    api.get('/audit-logs', { params: { entityType, entityId } }).then(r => r.data),
};

// ── ROOMS ──
export const roomAPI = {
  getAll: (params?: any) => api.get('/rooms', { params }).then(r => r.data),
  getDeleted: () => api.get('/rooms/deleted').then(r => r.data),
  getAvailability: (hotelId: string, from?: string, to?: string) =>
    api.get('/rooms/availability', { params: { hotelId, from, to } }).then(r => r.data),
  getOne: (id: string) => api.get(`/rooms/${id}`).then(r => r.data),
  getBookedRanges: (id: string) => api.get(`/rooms/${id}/availability`).then(r => r.data),
  create: (data: any) => api.post('/rooms', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/rooms/${id}`, data).then(r => r.data),
  bulkUpdatePrice: (ids: string[], payload: { mode: 'set' | 'percent'; price?: number; weekendRate?: number; percent?: number }) =>
    api.put('/rooms/bulk-price', { ids, ...payload }).then(r => r.data),
  delete: (id: string) => api.delete(`/rooms/${id}`).then(r => r.data),
  restore: (id: string) => api.put(`/rooms/${id}/restore`, {}).then(r => r.data),
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return api.post('/rooms/upload-images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

// ── BOOKINGS ──
export const bookingAPI = {
  getAll: () => api.get('/bookings').then(r => r.data),
  create: (data: any) => api.post('/bookings', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/bookings/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/bookings/${id}`).then(r => r.data),
  checkIn: (id: string) => api.put(`/bookings/${id}/check-in`, {}).then(r => r.data),
  checkOut: (id: string) => api.put(`/bookings/${id}/check-out`, {}).then(r => r.data),
  cancel: (id: string, reason: string) => api.put(`/bookings/${id}/cancel`, { reason }).then(r => r.data),
  reschedule: (id: string, data: { roomId?: string; checkIn: string; checkOut: string }) =>
    api.put(`/bookings/${id}/reschedule`, data).then(r => r.data),
  downloadInvoice: async (id: string, bookingRef: string) => {
    const res = await api.get(`/bookings/${id}/invoice`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = `invoice-${bookingRef}.pdf`; a.click();
    URL.revokeObjectURL(url);
  },
};

// ── REVIEWS ──
export const reviewAPI = {
  getMine: () => api.get('/reviews/mine').then(r => r.data),
  getForHotel: (hotelId: string) => api.get(`/reviews/hotel/${hotelId}`).then(r => r.data),
  create: (data: { bookingId: string; rating: number; comment?: string }) => api.post('/reviews', data).then(r => r.data),
  update: (id: string, data: { rating?: number; comment?: string }) => api.put(`/reviews/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/reviews/${id}`).then(r => r.data),
};

// ── SERVICES / AMENITIES ──
export const serviceAPI = {
  getAll: (hotelId?: string) => api.get('/services', { params: hotelId ? { hotelId } : {} }).then(r => r.data),
  getPublic: (hotelId?: string) => api.get('/services/public', { params: hotelId ? { hotelId } : {} }).then(r => r.data),
  create: (data: any) => api.post('/services', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/services/${id}`).then(r => r.data),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/services/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

// ── STAFF ──
export const staffAPI = {
  getAll: (hotelId?: string, includeOffboarded?: boolean) =>
    api.get('/staff', { params: { ...(hotelId ? { hotelId } : {}), ...(includeOffboarded ? { includeOffboarded: 'true' } : {}) } }).then(r => r.data),
  create: (data: any) => api.post('/staff', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/staff/${id}`, data).then(r => r.data),
  offboard: (id: string, reason?: string) => api.put(`/staff/${id}/offboard`, { reason }).then(r => r.data),
  restore: (id: string) => api.put(`/staff/${id}/restore`, {}).then(r => r.data),
};

// ── AMENITY USAGE / BILLING ──
export const amenityUsageAPI = {
  getByBooking: (bookingId: string) => api.get('/amenity-usage', { params: { bookingId } }).then(r => r.data),
  getAll: (hotelId?: string) => api.get('/amenity-usage', { params: hotelId ? { hotelId } : {} }).then(r => r.data),
  create: (data: any) => api.post('/amenity-usage', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/amenity-usage/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/amenity-usage/${id}`).then(r => r.data),
};

// ── MENU ITEMS ──
export const menuItemAPI = {
  getAll: (hotelId?: string) => api.get('/menu-items', { params: hotelId ? { hotelId } : {} }).then(r => r.data),
  getPublic: (hotelId?: string) => api.get('/menu-items/public', { params: hotelId ? { hotelId } : {} }).then(r => r.data),
  getDeleted: (hotelId?: string) => api.get('/menu-items/deleted', { params: hotelId ? { hotelId } : {} }).then(r => r.data),
  create: (data: any) => api.post('/menu-items', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/menu-items/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/menu-items/${id}`).then(r => r.data),
  restore: (id: string) => api.put(`/menu-items/${id}/restore`, {}).then(r => r.data),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/menu-items/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

// ── ORDERS ──
export const orderAPI = {
  getAll: (hotelId?: string) => api.get('/orders', { params: hotelId ? { hotelId } : {} }).then(r => r.data),
  create: (data: any) => api.post('/orders', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data).then(r => r.data),
};

// ── COUPONS ──
export const couponAPI = {
  getAll: () => api.get('/coupons').then(r => r.data),
  create: (data: any) => api.post('/coupons', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/coupons/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/coupons/${id}`).then(r => r.data),
  validate: (code: string, bookingAmount: number) => api.post('/coupons/validate', { code, bookingAmount }).then(r => r.data),
};

// BLOGS
export const blogAPI = {
  getPublished: (params?: any) => api.get('/blogs', { params }).then(r => r.data),
  getPublishedOne: (slug: string) => api.get(`/blogs/${slug}`).then(r => r.data),
  getAdminAll: (params?: any) => api.get('/blogs/admin', { params }).then(r => r.data),
  getAdminOne: (id: string) => api.get(`/blogs/admin/${id}`).then(r => r.data),
  create: (data: any) => api.post('/blogs/admin', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/blogs/admin/${id}`, data).then(r => r.data),
  archive: (id: string) => api.delete(`/blogs/admin/${id}`).then(r => r.data),
  hardDelete: (id: string) => api.delete(`/blogs/admin/${id}/permanent`).then(r => r.data),
  uploadCover: (file: File) => {
    const formData = new FormData();
    formData.append('cover', file);
    return api.post('/blogs/admin/upload-cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

// ── USERS ──
// ── USERS ──
// NOTIFICATIONS
export const notificationAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }).then(r => r.data),
  getMine: () => api.get('/notifications/my').then(r => r.data),
  create: (data: any) => api.post('/notifications', data).then(r => r.data),
  markMineRead: (id: string) => api.put(`/notifications/my/${id}/read`, {}).then(r => r.data),
  markRead: (ids: string[]) => api.put('/notifications/mark-read', { ids }).then(r => r.data),
  snooze: (ids: string[], until: string) => api.put('/notifications/snooze', { ids, until }).then(r => r.data),
  delete: (id: string) => api.delete(`/notifications/${id}`).then(r => r.data),
  cleanup: (days: number) => api.delete('/notifications/cleanup', { data: { days } }).then(r => r.data),
};

export const userAPI = {
  getAll: (params?: any) => api.get('/users', { params }).then(r => r.data),
  getDeleted: () => api.get('/users/deleted').then(r => r.data),
  getAdmins: () => api.get('/users/admins').then(r => r.data),
  createManager: (data: any) => api.post('/users/manager', data).then(r => r.data),
  createAdmin: (data: any) => api.post('/users/admin', data).then(r => r.data),
  createCustomer: (data: any) => api.post('/users/customer', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then(r => r.data),
  toggleStatus: (id: string) => api.put(`/users/${id}/toggle-status`, {}).then(r => r.data),
  resetPassword: (id: string, newPassword: string) => api.put(`/users/${id}/reset-password`, { newPassword }).then(r => r.data),
  ban: (id: string, reason: string) => api.put(`/users/${id}/ban`, { reason }).then(r => r.data),
  unban: (id: string) => api.put(`/users/${id}/unban`, {}).then(r => r.data),
  softDelete: (id: string) => api.put(`/users/${id}/soft-delete`, {}).then(r => r.data),
  restore: (id: string) => api.put(`/users/${id}/restore`, {}).then(r => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
  anonymize: (id: string) => api.put(`/users/${id}/anonymize`, {}).then(r => r.data),
  uploadId: (file: File) => {
    const formData = new FormData();
    formData.append('idDocument', file);
    return api.post('/users/upload-id', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

// ── CONTACT ──
export const contactAPI = {
  submit: (data: any) => api.post('/contact', data).then(r => r.data),
  getAll: () => api.get('/contact').then(r => r.data),
  update: (id: string, data: any) => api.put(`/contact/${id}`, data).then(r => r.data),
};

export default api;
