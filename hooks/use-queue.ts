// CabinetX-UI/CabinetXFrontEnd/hooks/use-queue.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueApi, ReorderQueueRequest } from '@/api/queue.api';
import { AppointmentResponse, appointmentHelpers } from '@/api/appointment.api';

/**
 * Hook to fetch queue for a specific date and cabinet
 */
export function useQueue(date: string, cabinetId: number) {
    return useQuery<AppointmentResponse[], Error>({
        queryKey: ['queue', 'by-date', date, cabinetId],
        queryFn: async () => {
            const response = await queueApi.getByDate(date, cabinetId);
            return response.data;
        },
        staleTime: 5000, // Consider data fresh for 5 seconds
        refetchInterval: 30000, // Auto-refetch every 30 seconds
        refetchOnWindowFocus: true, // Refetch when window regains focus
        enabled: !!date && !!cabinetId,
    });
}

/**
 * Hook to add appointment to queue
 */
export function useAddToQueue() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, number>({
        mutationFn: async (appointmentId: number) => {
            const response = await queueApi.addToQueue(appointmentId);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate queue queries
            queryClient.invalidateQueries({
                queryKey: ['queue', 'by-date', data.date, data.cabinetId],
            });
            // Invalidate appointments queries
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'by-date', data.date, data.cabinetId],
            });
        },
    });
}

/**
 * Hook to remove appointment from queue
 */
export function useRemoveFromQueue() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, number>({
        mutationFn: async (appointmentId: number) => {
            const response = await queueApi.removeFromQueue(appointmentId);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate queue queries
            queryClient.invalidateQueries({
                queryKey: ['queue', 'by-date', data.date, data.cabinetId],
            });
            // Invalidate appointments queries
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'by-date', data.date, data.cabinetId],
            });
        },
    });
}

/**
 * Hook to call next patient (move to EN_CONSULTATION)
 */
export function useCallNext() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, number>({
        mutationFn: async (appointmentId: number) => {
            const response = await queueApi.callNext(appointmentId);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate queue queries
            queryClient.invalidateQueries({
                queryKey: ['queue', 'by-date', data.date, data.cabinetId],
            });
            // Invalidate appointments queries
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'by-date', data.date, data.cabinetId],
            });
            // Invalidate in-consultation query
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'in-consultation', data.date, data.cabinetId],
            });
        },
    });
}

/**
 * Hook to reorder queue (for drag & drop)
 */
export function useReorderQueue() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse[], Error, ReorderQueueRequest>({
        mutationFn: async (data: ReorderQueueRequest) => {
            const response = await queueApi.reorderQueue(data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate queue queries
            queryClient.invalidateQueries({
                queryKey: ['queue', 'by-date', variables.date, variables.cabinetId],
            });
        },
    });
}
