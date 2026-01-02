// CabinetX-UI/CabinetXFrontEnd/api/patient.api.ts

import apiClient from './client';

// Enums matched with Backend
export type Sexe = 'MASCULIN' | 'FEMININ' | 'AUTRE';
export type TypeMutuelle = 'CNSS' | 'CNOPS' | 'PRIVEE' | 'AUCUNE';

export interface Adresse {
    rue: string;
    ville: string;
    codePostal?: string;
    pays?: string;
}

export interface Patient {
    id: number;
    nom: string;
    prenom: string;
    cin: string;
    dateNaissance: string;
    numTel: string;
    adresse?: Adresse;
    typeMutuelle?: TypeMutuelle;
    sexe: Sexe;
    cabinetId: number;
    createdAt?: string;
}

export interface CreatePatientDTO extends Omit<Patient, 'id' | 'createdAt'> {}

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