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
 * Optimized: Optimistic update for instant UI feedback
 */
export function useAddToQueue() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, number>({
        mutationFn: async (appointmentId: number) => {
            const response = await queueApi.addToQueue(appointmentId);
            return response.data;
        },
        onMutate: async (appointmentId) => {
            // We don't have enough info to optimistically update, so just cancel outgoing requests
            await queryClient.cancelQueries({ queryKey: ['queue'] });
            await queryClient.cancelQueries({ queryKey: ['appointments'] });

            return { appointmentId };
        },
        onSuccess: (data) => {
            // Update queue cache
            queryClient.setQueryData<AppointmentResponse[]>(
                ['queue', 'by-date', data.date, data.cabinetId],
                (old) => old ? [...old, data] : [data]
            );

            // Update appointment cache
            queryClient.setQueryData<AppointmentResponse[]>(
                ['appointments', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.map(apt => apt.id === data.id ? data : apt) : [data]
            );
        },
        onSettled: () => {
            // Invalidate queries to ensure data is fresh
            queryClient.invalidateQueries({ queryKey: ['queue'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
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
        onSettled: () => {
            // Invalidate queries to ensure data is fresh
            queryClient.invalidateQueries({ queryKey: ['queue'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
    });
}

/**
 * Hook to call next patient (move to EN_CONSULTATION)
 * Optimized: Optimistic update for instant UI feedback
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

            // Optimistically REMOVE from queue (since it's now in consultation)
            queryCache.findAll({ queryKey: ['queue', 'by-date'] }).forEach(query => {
                queryClient.setQueryData<AppointmentResponse[]>(
                    query.queryKey,
                    (old) => old ? old.filter(apt => apt.id !== appointmentId) : []
                );
            });

            queryCache.findAll({ queryKey: ['appointments', 'by-date'] }).forEach(query => {
                queryClient.setQueryData<AppointmentResponse[]>(
                    query.queryKey,
                    (old) => old ? old.map(apt =>
                        apt.id === appointmentId ? { ...apt, statutRDV: 'EN_CONSULTATION' as const } : apt
                    ) : []
                );
            });

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
            // Remove from queue cache (now in consultation)
            queryClient.setQueryData<AppointmentResponse[]>(
                ['queue', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.filter(apt => apt.id !== data.id) : []
            );

            queryClient.setQueryData<AppointmentResponse[]>(
                ['appointments', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.map(apt => apt.id === data.id ? data : apt) : [data]
            );

            // Update in-consultation cache
            queryClient.setQueryData(['appointments', 'in-consultation', data.date, data.cabinetId], data);
        },
        onSettled: () => {
            // Invalidate queries to ensure data is fresh after state changes
            queryClient.invalidateQueries({ queryKey: ['queue'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
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
