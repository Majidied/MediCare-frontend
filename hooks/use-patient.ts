import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi, CreatePatientDTO } from '@/api/patient.api';

// Query Keys
export const patientKeys = {
    all: ['patients'] as const,
    byCabinet: (cabinetId: number) => [...patientKeys.all, 'cabinet', cabinetId] as const,
    detail: (id: number) => [...patientKeys.all, id] as const,
    byCin: (cin: string) => [...patientKeys.all, 'cin', cin] as const,
};

// Hooks
export function usePatients(cabinetId: number) {
    return useQuery({
        queryKey: patientKeys.byCabinet(cabinetId),
        queryFn: async () => {
            const { data } = await patientApi.getByCabinet(cabinetId);
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - patients don't change often
        enabled: cabinetId > 0,
    });
}

export function usePatient(id: number) {
    return useQuery({
        queryKey: patientKeys.detail(id),
        queryFn: async () => {
            const { data } = await patientApi.getById(id);
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
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
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!cin,
    });
}

export function useCreatePatient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (patient: CreatePatientDTO) => patientApi.create(patient),
        onMutate: async (newPatient) => {
            // Cancel outgoing refetches
            await qc.cancelQueries({ queryKey: patientKeys.all });

            // Snapshot previous values
            const previousPatients = qc.getQueryData(patientKeys.byCabinet(newPatient.cabinetId));

            // Optimistically add new patient with temporary ID
            if (previousPatients) {
                qc.setQueryData(
                    patientKeys.byCabinet(newPatient.cabinetId),
                    (old: any) => [...(old || []), { ...newPatient, id: Date.now() }]
                );
            }

            return { previousPatients, cabinetId: newPatient.cabinetId };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            const ctx = context as { previousPatients?: any; cabinetId?: number };
            if (ctx?.previousPatients && ctx.cabinetId) {
                qc.setQueryData(patientKeys.byCabinet(ctx.cabinetId), ctx.previousPatients);
            }
        },
        onSuccess: (response, variables) => {
            // Update with actual server data
            qc.setQueryData(
                patientKeys.byCabinet(variables.cabinetId),
                (old: any) => {
                    if (!old) return [response.data];
                    return old.map((p: any) => p.cin === response.data.cin ? response.data : p);
                }
            );
        },
    });
}

export function useUpdatePatient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreatePatientDTO> }) =>
            patientApi.update(id, data),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await qc.cancelQueries({ queryKey: patientKeys.all });

            // Snapshot previous values
            const previousPatient = qc.getQueryData(patientKeys.detail(id));
            const cabinetId = (previousPatient as any)?.cabinetId;
            const previousList = cabinetId ? qc.getQueryData(patientKeys.byCabinet(cabinetId)) : undefined;

            // Optimistically update
            if (previousPatient) {
                qc.setQueryData(patientKeys.detail(id), (old: any) => ({ ...old, ...data }));
            }
            if (previousList && cabinetId) {
                qc.setQueryData(
                    patientKeys.byCabinet(cabinetId),
                    (old: any) => old?.map((p: any) => p.id === id ? { ...p, ...data } : p)
                );
            }

            return { previousPatient, previousList, cabinetId };
        },
        onError: (err, { id }, context) => {
            // Rollback on error
            const ctx = context as { previousPatient?: any; previousList?: any; cabinetId?: number };
            if (ctx?.previousPatient) {
                qc.setQueryData(patientKeys.detail(id), ctx.previousPatient);
            }
            if (ctx?.previousList && ctx.cabinetId) {
                qc.setQueryData(patientKeys.byCabinet(ctx.cabinetId), ctx.previousList);
            }
        },
        onSuccess: (response, { id }) => {
            // Update with actual server data
            qc.setQueryData(patientKeys.detail(id), response.data);
            const cabinetId = (response.data as any)?.cabinetId;
            if (cabinetId) {
                qc.setQueryData(
                    patientKeys.byCabinet(cabinetId),
                    (old: any) => old?.map((p: any) => p.id === id ? response.data : p)
                );
            }
        },
    });
}

export function useDeletePatient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => patientApi.delete(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await qc.cancelQueries({ queryKey: patientKeys.all });

            // Snapshot and optimistically remove
            const queryCache = qc.getQueryCache();
            const previousData = new Map();

            queryCache.findAll({ queryKey: patientKeys.all }).forEach(query => {
                previousData.set(query.queryKey, query.state.data);
                qc.setQueryData(
                    query.queryKey,
                    (old: any) => Array.isArray(old) ? old.filter((p: any) => p.id !== id) : old
                );
            });

            return { previousData };
        },
        onError: (err, id, context) => {
            // Rollback on error
            const ctx = context as { previousData?: Map<any, any> };
            if (ctx?.previousData) {
                ctx.previousData.forEach((data: any, queryKey: any) => {
                    qc.setQueryData(queryKey, data);
                });
            }
        },
        onSuccess: () => {
            // Remove from cache
            qc.removeQueries({ queryKey: patientKeys.all });
        },
    });
}
