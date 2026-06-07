import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  const token = (session as any)?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data ?? err),
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) =>
    api.patch('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const auditApi = {
  list: (params?: Record<string, any>) => api.get('/audit', { params }),
};

export const analyticsApi = {
  global: () => api.get('/analytics/global'),
  branch: () => api.get('/analytics/branch'),
  student: (id: string) => api.get(`/analytics/student/${id}`),
  course: (id: string) => api.get(`/analytics/course/${id}`),
  revenueTimeline: (days = 30) => api.get(`/analytics/revenue-timeline?days=${days}`),
};

export const usersApi = {
  list: (params?: Record<string, any>) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string, newPassword: string) => api.post(`/users/${id}/reset-password`, { newPassword }),
};

export const tenantsApi = {
  list: (params?: Record<string, any>) => api.get('/tenants', { params }),
  create: (data: any) => api.post('/tenants', data),
  get: (id: string) => api.get(`/tenants/${id}`),
  stats: (id: string) => api.get(`/tenants/${id}/stats`),
  update: (id: string, data: any) => api.patch(`/tenants/${id}`, data),
  remove: (id: string) => api.delete(`/tenants/${id}`),
};

export const coursesApi = {
  list: (params?: Record<string, any>) => api.get('/courses', { params }),
  create: (data: any) => api.post('/courses', data),
  get: (id: string) => api.get(`/courses/${id}`),
  update: (id: string, data: any) => api.patch(`/courses/${id}`, data),
  remove: (id: string) => api.delete(`/courses/${id}`),
};

export const enrollmentsApi = {
  enroll: (userId: string, courseId: string) => api.post('/enrollments', { userId, courseId }),
  myEnrollments: () => api.get('/enrollments/my'),
  byCourse: (courseId: string) => api.get(`/enrollments/course/${courseId}?limit=200`),
  byStudent: (userId: string) => api.get(`/enrollments/student/${userId}`),
};

export const sessionsApi = {
  branch: (upcoming = false) => api.get(`/sessions/branch?upcoming=${upcoming}`),
  byCourse: (courseId: string) => api.get(`/sessions/course/${courseId}`),
  get: (id: string) => api.get(`/sessions/${id}`),
  create: (data: any) => api.post('/sessions', data),
};

export const attendanceManageApi = {
  bySession: (sessionId: string) => api.get(`/attendance/session/${sessionId}`),
  markManual: (userId: string, sessionId: string, status: string, notes?: string) =>
    api.post('/attendance/manual', { userId, sessionId, status, notes }),
  bulkMark: (sessionId: string, records: { userId: string; status: string }[]) =>
    api.post('/attendance/bulk', { sessionId, records }),
};

export const attendanceApi = {
  trigger: (sessionId: string) => api.post('/attendance/trigger', { sessionId }),
  bySession: (sessionId: string) => api.get(`/attendance/session/${sessionId}`),
  byStudent: (userId: string, courseId?: string) =>
    api.get(`/attendance/student/${userId}${courseId ? `?courseId=${courseId}` : ''}`),
  lowAttendance: () => api.get('/attendance/alerts/low'),
};

export const financeApi = {
  summary: () => api.get('/finance/summary'),
  ledger: (params?: Record<string, any>) => api.get('/finance/ledger', { params }),
  studentLedger: (userId: string) => api.get(`/finance/student/${userId}`),
  outstanding: () => api.get('/finance/outstanding'),
  createEntry: (data: any) => api.post('/finance/entries', data),
};

export const notificationsApi = {
  list: (unread = false) => api.get(`/notifications?unread=${unread}`),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const certificatesApi = {
  mine: () => api.get('/certificates/my'),
  byStudent: (userId: string) => api.get(`/certificates/student/${userId}`),
  verify: (code: string) => api.get(`/certificates/verify/${code}`),
  issue: (userId: string, courseId: string) => api.post('/certificates/issue', { userId, courseId }),
};

export const assessmentsApi = {
  byCourse: (courseId: string) => api.get(`/assessments/course/${courseId}`),
  submit: (id: string, data: any) => api.post(`/assessments/${id}/submit`, data),
  grade: (id: string, studentId: string, data: any) => api.post(`/assessments/${id}/grade/${studentId}`, data),
  mySubmissions: () => api.get('/assessments/my-submissions'),
};
