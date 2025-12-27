import apiClient from '../api-client';

export const medicationService = {
  create: (data: any) => 
    apiClient.post('/api/medications', data),
  
  update: (id: number, data: any) => 
    apiClient.put(`/api/medications/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete(`/api/medications/${id}`),
  
  getById: (id: number) => 
    apiClient.get(`/api/medications/${id}`),
  
  autocomplete: (term: string) => 
    apiClient.get('/api/medications/autocomplete', { params: { term } }),
  
  getAll: () => 
    apiClient.get('/api/medications'),
  
  importFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/medications/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};