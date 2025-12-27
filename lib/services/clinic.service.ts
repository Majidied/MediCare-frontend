import apiClient from '../api-client';

export const clinicService = {
  create: (data: any) => 
    apiClient.post('/api/clinics', data),
  
  update: (id: number, data: any) => 
    apiClient.put(`/api/clinics/${id}`, data),
  
  activate: (id: number) => 
    apiClient.patch(`/api/clinics/${id}/activate`),
  
  deactivate: (id: number) => 
    apiClient.patch(`/api/clinics/${id}/deactivate`),
  
  getById: (id: number) => 
    apiClient.get(`/api/clinics/${id}`),
  
  getAll: () => 
    apiClient.get('/api/clinics'),
  
  getActive: () => 
    apiClient.get('/api/clinics/active'),
  
  getNearExpiration: (daysBefore: number = 30) => 
    apiClient.get('/api/clinics/near-expiration', { params: { daysBefore } }),
};