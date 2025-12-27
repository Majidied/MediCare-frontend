import apiClient from '../api-client';

export const appointmentService = {
  create: (data: any) => 
    apiClient.post('/appointments/rendezvous', data),
  
  getById: (id: number) => 
    apiClient.get(`/appointments/${id}`),
  
  update: (id: number, data: any) => 
    apiClient.put(`/appointments/update/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete(`/appointments/delete/${id}`),
};