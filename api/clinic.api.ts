import apiClient from './client';

// Types
export type ClinicStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface ClinicDTO {
    id?: number;
    name: string;
    specialty: string;
    phone: string;
    address: string;
    logoUrl?: string;
    status: ClinicStatus;
    serviceEndDate: string; // ISO date string (LocalDate)
}

export type CreateClinicDTO = Omit<ClinicDTO, 'id'>;

// API Calls
export const clinicApi = {
    getAll: () =>
        apiClient.get<ClinicDTO[]>('/api/clinics'),

    getById: (id: number) =>
        apiClient.get<ClinicDTO>(`/api/clinics/${id}`),

    getActive: () =>
        apiClient.get<ClinicDTO[]>('/api/clinics/active'),

    getNearExpiration: (daysBefore: number = 30) =>
        apiClient.get<ClinicDTO[]>('/api/clinics/near-expiration', { params: { daysBefore } }),

    create: (data: CreateClinicDTO) =>
        apiClient.post<ClinicDTO>('/api/clinics', data),

    update: (id: number, data: CreateClinicDTO) =>
        apiClient.put<ClinicDTO>(`/api/clinics/${id}`, data),

    activate: (id: number) =>
        apiClient.patch<ClinicDTO>(`/api/clinics/${id}/activate`),

    deactivate: (id: number) =>
        apiClient.patch<ClinicDTO>(`/api/clinics/${id}/deactivate`),
};
