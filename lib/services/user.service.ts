import apiClient from '../api-client';

export const userService = {
  create: (data: any) => 
    apiClient.post('/api/users', data),
  
  getById: (id: number) => 
    apiClient.get(`/api/users/${id}`),
  
  update: (id: number, data: any) => 
    apiClient.put(`/api/users/${id}`, data),
  
  activate: (id: number) => 
    apiClient.post(`/api/users/${id}/activate`),
  
  deactivate: (id: number) => 
    apiClient.post(`/api/users/${id}/deactivate`),
  
  getByClinic: (clinicId: number) => 
    apiClient.get(`/api/users/clinic/${clinicId}`),
  
  getByRole: (role: string) => 
    apiClient.get(`/api/users/role/${role}`),
};