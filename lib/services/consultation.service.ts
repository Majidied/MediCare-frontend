import apiClient from '../api-client';

export const consultationService = {
  create: (data: any) => 
    apiClient.post('/api/consultations', data),
  
  update: (id: number, data: any) => 
    apiClient.put(`/api/consultations/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete(`/api/consultations/${id}`),
  
  getById: (id: number) => 
    apiClient.get(`/api/consultations/${id}`),
  
  getByRendezVous: (rendezVousId: number) => 
    apiClient.get(`/api/consultations/rendezvous/${rendezVousId}`),
  
  getPatientHistory: (patientId: number) => 
    apiClient.get(`/api/consultations/patients/${patientId}/historique`),
  
  getMedecinDay: (medecinId: number, date: string) => 
    apiClient.get(`/api/consultations/medecins/${medecinId}/jour`, { params: { date } }),
  
  getMedecinPeriod: (medecinId: number, debut: string, fin: string) => 
    apiClient.get(`/api/consultations/medecins/${medecinId}/periode`, { params: { debut, fin } }),
};