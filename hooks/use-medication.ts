import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationApi, MedicationDTO, CreateMedicationDTO } from '@/api/medication.api';

// Query Keys
export const medicationKeys = {
    all: ['medications'] as const,
    list: () => [...medicationKeys.all, 'list'] as const,
    detail: (id: number) => [...medicationKeys.all, id] as const,
    autocomplete: (term: string) => [...medicationKeys.all, 'autocomplete', term] as const,
};

// Hooks
export function useMedications() {
    return useQuery({
        queryKey: medicationKeys.list(),
        queryFn: async () => {
            const { data } = await medicationApi.getAll();
            return data;
        },
    });
}

export function useMedication(id: number) {
    return useQuery({
        queryKey: medicationKeys.detail(id),
        queryFn: async () => {
            const { data } = await medicationApi.getById(id);
            return data;
        },
        enabled: id > 0,
    });
}

export function useMedicationAutocomplete(term: string) {
    return useQuery({
        queryKey: medicationKeys.autocomplete(term),
        queryFn: async () => {
            const { data } = await medicationApi.autocomplete(term);
            return data;
        },
        enabled: term.length >= 2,
    });
}

export function useCreateMedication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (medication: CreateMedicationDTO) => medicationApi.create(medication),
        onSuccess: () => qc.invalidateQueries({ queryKey: medicationKeys.all }),
    });
}

export function useUpdateMedication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateMedicationDTO> }) =>
            medicationApi.update(id, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: medicationKeys.detail(id) });
            qc.invalidateQueries({ queryKey: medicationKeys.all });
        },
    });
}

export function useDeleteMedication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => medicationApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: medicationKeys.all }),
    });
}

export function useImportMedications() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => medicationApi.importFile(file),
        onSuccess: () => qc.invalidateQueries({ queryKey: medicationKeys.all }),
    });
}
