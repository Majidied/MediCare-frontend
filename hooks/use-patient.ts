import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi, CreatePatientDTO } from '@/api/patient.api';

// Query Keys
export const patientKeys = {
    all: ['patients'] as const,
    list: (filters?: { nom?: string; prenom?: string }) => [...patientKeys.all, filters] as const,
    detail: (id: number) => [...patientKeys.all, id] as const,
    byCin: (cin: string) => [...patientKeys.all, 'cin', cin] as const,
};

// Hooks
export function usePatients(nom?: string, prenom?: string) {
    return useQuery({
        queryKey: patientKeys.list({ nom, prenom }),
        queryFn: async () => {
            const { data } = await patientApi.getAll(nom, prenom);
            return data;
        },
    });
}

export function usePatient(id: number) {
    return useQuery({
        queryKey: patientKeys.detail(id),
        queryFn: async () => {
            const { data } = await patientApi.getById(id);
            return data;
        },
        enabled: id > 0,
    });
}

export function usePatientByCin(cin: string) {
    return useQuery({
        queryKey: patientKeys.byCin(cin),
        queryFn: async () => {
            const { data } = await patientApi.getByCin(cin);
            return data;
        },
        enabled: !!cin,
    });
}

export function useCreatePatient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (patient: CreatePatientDTO) => patientApi.create(patient),
        onSuccess: () => qc.invalidateQueries({ queryKey: patientKeys.all }),
    });
}

export function useUpdatePatient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreatePatientDTO> }) =>
            patientApi.update(id, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: patientKeys.detail(id) });
            qc.invalidateQueries({ queryKey: patientKeys.all });
        },
    });
}

export function useDeletePatient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => patientApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: patientKeys.all }),
    });
}
