import apiClient from '../api-client';

export const billingService = {
  createInvoice: (consultationId: number, amount: number) => 
    apiClient.post('/api/billing/invoices', null, { params: { consultationId, amount } }),
  
  markAsPaid: (id: number, paymentMethod: string) => 
    apiClient.put(`/api/billing/invoices/${id}/payment`, null, { params: { paymentMethod } }),
  
  cancel: (id: number) => 
    apiClient.put(`/api/billing/invoices/${id}/cancel`),
  
  getById: (id: number) => 
    apiClient.get(`/api/billing/invoices/${id}`),
  
  getByPatient: (patientId: number) => 
    apiClient.get(`/api/billing/patients/${patientId}/invoices`),
  
  downloadPDF: (id: number) => 
    apiClient.get(`/api/billing/invoices/${id}/pdf`, { responseType: 'blob' }),
};