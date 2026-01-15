// CabinetX-UI/CabinetXFrontEnd/hooks/use-queue.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueApi, ReorderQueueRequest } from '@/api/queue.api';
import { AppointmentResponse, appointmentHelpers } from '@/api/appointment.api';

/**
 * Hook to fetch queue for a specific date and cabinet
 * Optimized: Removed aggressive refetchInterval, increased staleTime
 */
export function useQueue(date: string, cabinetId: number) {
    return useQuery<AppointmentResponse[], Error>({
        queryKey: ['queue', 'by-date', date, cabinetId],
        queryFn: async () => {
            const response = await queueApi.getByDate(date, cabinetId);
            return response.data;
        },
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: false,
        enabled: !!date && !!cabinetId,
    });
}

/**
 * Hook to add appointment to queue
 * Adds appointment to queue and updates status to EN_ATTENTE
 */
export function useAddToQueue() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, number>({
        mutationFn: async (appointmentId: number) => {
            const response = await queueApi.addToQueue(appointmentId);
            return response.data;
        },
        onMutate: async (appointmentId) => {
            // Cancel outgoing requests to prevent race conditions
            await queryClient.cancelQueries({ queryKey: ['queue'] });
            await queryClient.cancelQueries({ queryKey: ['appointments'] });

            return { appointmentId };
        },
        onSuccess: (data) => {
            // Add to queue cache (only if not already there)
            queryClient.setQueryData<AppointmentResponse[]>(
                ['queue', 'by-date', data.date, data.cabinetId],
                (old) => {
                    if (!old) return [data];
                    // Avoid duplicates
                    const exists = old.some(apt => apt.id === data.id);
                    if (exists) {
                        return old.map(apt => apt.id === data.id ? data : apt);
                    }
                    return [...old, data];
                }
            );

            // Update appointment status in appointments cache
            queryClient.setQueryData<AppointmentResponse[]>(
                ['appointments', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.map(apt => apt.id === data.id ? data : apt) : [data]
            );
        },
    });
}

/**
 * Hook to remove appointment from queue
 * Optimized: Optimistic update for instant UI feedback
 */
export function useRemoveFromQueue() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, number>({
        mutationFn: async (appointmentId: number) => {
            const response = await queueApi.removeFromQueue(appointmentId);
            return response.data;
        },
        onMutate: async (appointmentId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['queue'] });

            // Snapshot previous queue
            const queryCache = queryClient.getQueryCache();
            const previousData = new Map();

            queryCache.findAll({ queryKey: ['queue', 'by-date'] }).forEach(query => {
                previousData.set(query.queryKey, query.state.data);
                // Optimistically remove from queue
                queryClient.setQueryData<AppointmentResponse[]>(
                    query.queryKey,
                    (old) => old ? old.filter(apt => apt.id !== appointmentId) : []
                );
            });

            return { previousData, appointmentId };
        },
        onError: (err, appointmentId, context) => {
            // Rollback on error
            const ctx = context as { previousData?: Map<any, any> };
            if (ctx?.previousData) {
                ctx.previousData.forEach((data: any, queryKey: any) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSuccess: (data) => {
            // Update with actual server response
            queryClient.setQueryData<AppointmentResponse[]>(
                ['queue', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.filter(apt => apt.id !== data.id) : []
            );

            // Update appointments cache
            queryClient.setQueryData<AppointmentResponse[]>(
                ['appointments', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.map(apt => apt.id === data.id ? data : apt) : [data]
            );
        },
    });
}

/**
 * Hook to call next patient (move to EN_CONSULTATION)
 * Optimized: Optimistic update for instant UI feedback
 * IMPORTANT: This REMOVES the patient from the queue and sets them as in-consultation
 */
export function useCallNext() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, number>({
        mutationFn: async (appointmentId: number) => {
            const response = await queueApi.callNext(appointmentId);
            return response.data;
        },
        onMutate: async (appointmentId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['queue'] });
            await queryClient.cancelQueries({ queryKey: ['appointments'] });

            // Snapshot
            const queryCache = queryClient.getQueryCache();
            const previousData = new Map();

            queryCache.findAll({ queryKey: ['queue'] }).forEach(query => {
                previousData.set(query.queryKey, query.state.data);
            });
            queryCache.findAll({ queryKey: ['appointments'] }).forEach(query => {
                previousData.set(query.queryKey, query.state.data);
            });

            // Find the appointment to get its data for in-consultation
            let appointmentData: AppointmentResponse | undefined;

            // Optimistically REMOVE from queue (not just update status)
            queryCache.findAll({ queryKey: ['queue', 'by-date'] }).forEach(query => {
                const queueData = queryClient.getQueryData<AppointmentResponse[]>(query.queryKey);
                if (queueData) {
                    appointmentData = queueData.find(apt => apt.id === appointmentId);
                }
                queryClient.setQueryData<AppointmentResponse[]>(
                    query.queryKey,
                    (old) => old ? old.filter(apt => apt.id !== appointmentId) : []
                );
            });

            // Update status in appointments cache
            queryCache.findAll({ queryKey: ['appointments', 'by-date'] }).forEach(query => {
                queryClient.setQueryData<AppointmentResponse[]>(
                    query.queryKey,
                    (old) => old ? old.map(apt =>
                        apt.id === appointmentId ? { ...apt, statutRDV: 'EN_CONSULTATION' as const } : apt
                    ) : []
                );
            });

            // Optimistically set in-consultation
            if (appointmentData) {
                queryCache.findAll({ queryKey: ['appointments', 'in-consultation'] }).forEach(query => {
                    queryClient.setQueryData<AppointmentResponse | null>(
                        query.queryKey,
                        { ...appointmentData!, statutRDV: 'EN_CONSULTATION' as const }
                    );
                });
            }

            return { previousData };
        },
        onError: (err, appointmentId, context) => {
            // Rollback on error
            const ctx = context as { previousData?: Map<any, any> };
            if (ctx?.previousData) {
                ctx.previousData.forEach((data: any, queryKey: any) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSuccess: (data) => {
            // REMOVE from queue cache (patient is now in consultation, not in queue)
            queryClient.setQueryData<AppointmentResponse[]>(
                ['queue', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.filter(apt => apt.id !== data.id) : []
            );

            // Update appointments cache with new status
            queryClient.setQueryData<AppointmentResponse[]>(
                ['appointments', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.map(apt => apt.id === data.id ? data : apt) : [data]
            );

            // Set as current in-consultation patient
            queryClient.setQueryData(['appointments', 'in-consultation', data.date, data.cabinetId], data);
        },
    });
}

/**
 * Hook to reorder queue (for drag & drop)
 * Optimized: Optimistic update for instant drag-and-drop feedback
 */
export function useReorderQueue() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse[], Error, ReorderQueueRequest>({
        mutationFn: async (data: ReorderQueueRequest) => {
            const response = await queueApi.reorderQueue(data);
            return response.data;
        },
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: ['queue', 'by-date', variables.date, variables.cabinetId],
            });

            // Snapshot the previous queue
            const previousQueue = queryClient.getQueryData<AppointmentResponse[]>([
                'queue',
                'by-date',
                variables.date,
                variables.cabinetId,
            ]);

            // Optimistically reorder based on the new order of IDs
            if (previousQueue && variables.appointmentIds) {
                const reordered = variables.appointmentIds
                    .map(id => previousQueue.find(apt => apt.id === id))
                    .filter((apt): apt is AppointmentResponse => apt !== undefined);

                queryClient.setQueryData<AppointmentResponse[]>(
                    ['queue', 'by-date', variables.date, variables.cabinetId],
                    reordered
                );
            }

            return { previousQueue };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            const ctx = context as { previousQueue?: AppointmentResponse[] };
            if (ctx?.previousQueue) {
                queryClient.setQueryData(
                    ['queue', 'by-date', variables.date, variables.cabinetId],
                    ctx.previousQueue
                );
            }
        },
        onSuccess: (data, variables) => {
            // Update with actual server response
            queryClient.setQueryData(
                ['queue', 'by-date', variables.date, variables.cabinetId],
                data
            );
        },
    });
}
