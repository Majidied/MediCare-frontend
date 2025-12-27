import apiClient from '../api-client';

export const patientService = {
  getAll: (nom?: string, prenom?: string) => 
    apiClient.get('/api/patients', { params: { nom, prenom } }),
  
  getById: (id: number) => 
    apiClient.get(`/api/patients/${id}`),
  
  getByCin: (cin: string) => 
    apiClient.get(`/api/patients/cin/${cin}`),
  
  create: (data: any) => 
    apiClient.post('/api/patients', data),
  
  update: (id: number, data: any) => 
    apiClient.put(`/api/patients/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete(`/api/patients/${id}`),
};