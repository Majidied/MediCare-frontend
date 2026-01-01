import apiClient from './client';

// Types
export interface MedicationDTO {
    id?: number;
    commercialName: string;
    dci: string;
    dosage: string;
    form: string;
}

export type CreateMedicationDTO = Omit<MedicationDTO, 'id'>;

// API Calls
export const medicationApi = {
    getAll: () =>
        apiClient.get<MedicationDTO[]>('/api/medications'),

    getById: (id: number) =>
        apiClient.get<MedicationDTO>(`/api/medications/${id}`),

    autocomplete: (term: string) =>
        apiClient.get<MedicationDTO[]>('/api/medications/autocomplete', { params: { term } }),

    create: (data: CreateMedicationDTO) =>
        apiClient.post<MedicationDTO>('/api/medications', data),

    update: (id: number, data: Partial<CreateMedicationDTO>) =>
        apiClient.put<MedicationDTO>(`/api/medications/${id}`, data),

    delete: (id: number) =>
        apiClient.delete(`/api/medications/${id}`),

    importFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<number>('/api/medications/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};
