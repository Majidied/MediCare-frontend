import apiClient from './client';

// Types
export interface Patient {
    id: number;
    nom: string;
    prenom: string;
    cin: string;
    dateNaissance: string;
    numTel: string;
    adresse?: {
        rue: string;
        ville: string;
    };
    typeMutuelle?: string;
    sexe: string;
    cabinetId: number;
}

export interface CreatePatientDTO {
    nom: string;
    prenom: string;
    cin: string;
    dateNaissance: string;
    numTel: string;
    adresse?: { rue: string; ville: string };
    typeMutuelle?: string;
    sexe: string;
    cabinetId: number;
}

// API Calls
export const patientApi = {
    getAll: (nom?: string, prenom?: string) =>
        apiClient.get<Patient[]>('/api/patients', { params: { nom, prenom } }),

    getById: (id: number) =>
        apiClient.get<Patient>(`/api/patients/${id}`),

    getByCin: (cin: string) =>
        apiClient.get<Patient>(`/api/patients/cin/${cin}`),

    create: (data: CreatePatientDTO) =>
        apiClient.post<Patient>('/api/patients', data),

    update: (id: number, data: Partial<CreatePatientDTO>) =>
        apiClient.put<Patient>(`/api/patients/${id}`, data),

    delete: (id: number) =>
        apiClient.delete(`/api/patients/${id}`),
};
