import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicApi, ClinicDTO, CreateClinicDTO } from '@/api/clinic.api';

// Query Keys
export const clinicKeys = {
    all: ['clinics'] as const,
    list: () => [...clinicKeys.all, 'list'] as const,
    active: () => [...clinicKeys.all, 'active'] as const,
    nearExpiration: (days: number) => [...clinicKeys.all, 'near-expiration', days] as const,
    detail: (id: number) => [...clinicKeys.all, id] as const,
};

// Hooks
export function useClinics() {
    return useQuery({
        queryKey: clinicKeys.list(),
        queryFn: async () => {
            const { data } = await clinicApi.getAll();
            return data;
        },
    });
}

export function useClinic(id: number) {
    return useQuery({
        queryKey: clinicKeys.detail(id),
        queryFn: async () => {
            const { data } = await clinicApi.getById(id);
            return data;
        },
        enabled: id > 0,
    });
}

export function useActiveClinics() {
    return useQuery({
        queryKey: clinicKeys.active(),
        queryFn: async () => {
            const { data } = await clinicApi.getActive();
            return data;
        },
    });
}

export function useClinicsNearExpiration(daysBefore: number = 30) {
    return useQuery({
        queryKey: clinicKeys.nearExpiration(daysBefore),
        queryFn: async () => {
            const { data } = await clinicApi.getNearExpiration(daysBefore);
            return data;
        },
    });
}

export function useCreateClinic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (clinic: CreateClinicDTO) => clinicApi.create(clinic),
        onSuccess: () => qc.invalidateQueries({ queryKey: clinicKeys.all }),
    });
}

export function useUpdateClinic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateClinicDTO> }) =>
            clinicApi.update(id, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: clinicKeys.detail(id) });
            qc.invalidateQueries({ queryKey: clinicKeys.all });
        },
    });
}

export function useActivateClinic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => clinicApi.activate(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: clinicKeys.detail(id) });
            qc.invalidateQueries({ queryKey: clinicKeys.all });
        },
    });
}

export function useDeactivateClinic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => clinicApi.deactivate(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: clinicKeys.detail(id) });
            qc.invalidateQueries({ queryKey: clinicKeys.all });
        },
    });
}
