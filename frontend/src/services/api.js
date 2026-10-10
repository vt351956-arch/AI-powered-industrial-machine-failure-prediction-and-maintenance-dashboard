import apiClient from './apiClient';

export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getProfile: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const machineService = {
  list: (params) => apiClient.get('/machines', { params }),
  create: (data) => apiClient.post('/machines', data),
  get: (id) => apiClient.get(`/machines/${id}`),
  update: (id, data) => apiClient.put(`/machines/${id}`, data),
  delete: (id) => apiClient.delete(`/machines/${id}`),
};

export const sensorService = {
  list: (params) => apiClient.get('/sensors', { params }),
  create: (data) => apiClient.post('/sensors', data),
  getLatest: (machine_id) => apiClient.get('/sensors/latest', { params: { machine_id } }),
  generateBatch: (data) => apiClient.post('/sensors/synthetic-batch', data),
};

export const predictionService = {
  predict: (data) => apiClient.post('/predictions/predict', data),
  list: (params) => apiClient.get('/predictions', { params }),
  getModelInfo: () => apiClient.get('/predictions/model-info'),
};

export const maintenanceService = {
  list: (params) => apiClient.get('/maintenance', { params }),
  create: (data) => apiClient.post('/maintenance', data),
  get: (id) => apiClient.get(`/maintenance/${id}`),
  update: (id, data) => apiClient.put(`/maintenance/${id}`, data),
  delete: (id) => apiClient.delete(`/maintenance/${id}`),
};

export const dashboardService = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getHealthTrend: (params) => apiClient.get('/dashboard/health-trend', { params }),
  getFailureRisk: () => apiClient.get('/dashboard/failure-risk'),
  getSensorTrends: (params) => apiClient.get('/dashboard/sensor-trends', { params }),
  getScatterData: () => apiClient.get('/dashboard/scatter'),
  getMachineComparison: () => apiClient.get('/dashboard/machine-comparison'),
  getMaintenanceCost: () => apiClient.get('/dashboard/maintenance-cost'),
  getAll: (params) => apiClient.get('/dashboard/all', { params }),
};

export const alertService = {
  list: (params) => apiClient.get('/alerts', { params }),
};
