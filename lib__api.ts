import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

// ── HOTELS ──
export const hotelAPI = {
  getAll: (params?: any) => api.get('/hotels', { params }).then(r => r.data),
  getOne: (id: string) => api.get(`/hotels/${id}`).then(r => r.data),
  create: (data: any) => api.post('/hotels', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/hotels/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/hotels/${id}`).then(r => r.data),
};

// ── ROOMS ──
export const roomAPI = {
  getAll: (params?: any) => api.get('/rooms', { params }).then(r => r.data),
  getOne: (id: string) => api.get(`/rooms/${id}`).then(r => r.data),
  create: (data: any) => api.post('/rooms', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/rooms/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/rooms/${id}`).then(r => r.data),
};

// ── BOOKINGS ──
export const bookingAPI = {
  getAll: () => api.get('/bookings').then(r => r.data),
  create: (data: any) => api.post('/bookings', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/bookings/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/bookings/${id}`).then(r => r.data),
};

// ── USERS ──
export const userAPI = {
  getAll: (params?: any) => api.get('/users', { params }).then(r => r.data),
  createManager: (data: any) => api.post('/users/manager', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
};

// ── CONTACT ──
export const contactAPI = {
  submit: (data: any) => api.post('/contact', data).then(r => r.data),
  getAll: () => api.get('/contact').then(r => r.data),
  update: (id: string, data: any) => api.put(`/contact/${id}`, data).then(r => r.data),
};

export default api;
