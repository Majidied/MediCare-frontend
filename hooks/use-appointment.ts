// CabinetX-UI/CabinetXFrontEnd/hooks/use-appointment.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, AppointmentRequest, AppointmentResponse, appointmentHelpers, Appointment, StatutRDV } from '@/api/appointment.api';

/**
 * Hook to fetch appointments by date and cabinet
 * Optimized: Increased staleTime, removed aggressive refetchInterval
 */
export function useAppointmentsByDate(date: string, cabinetId: number) {
    return useQuery<AppointmentResponse[], Error>({
        queryKey: ['appointments', 'by-date', date, cabinetId],
        queryFn: async () => {
            const response = await appointmentApi.getByDate(date, cabinetId);
            return response.data;
        },
        staleTime: 60000, // 1 minute - data stays fresh longer
        refetchOnWindowFocus: false, // Disable auto-refetch on focus
        enabled: !!date && !!cabinetId,
    });
}

/**
 * Hook to fetch a single appointment by ID
 */
export function useAppointment(id: number) {
    return useQuery<AppointmentResponse, Error>({
        queryKey: ['appointments', id],
        queryFn: async () => {
            const response = await appointmentApi.getById(id);
            return response.data;
        },
        staleTime: 60000, // 1 minute
        enabled: !!id,
    });
}

/**
 * Hook to create a new appointment
 * Note: We do NOT use optimistic updates here because we don't have patient name info
 * The server returns the complete appointment data with patient name
 */
export function useCreateAppointment() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, AppointmentRequest>({
        mutationFn: async (data: AppointmentRequest) => {
            const response = await appointmentApi.create(data);
            return response.data;
        },
        onSuccess: (data) => {
            // Add the new appointment to cache with complete data from server (includes patient name)
            queryClient.setQueryData<AppointmentResponse[]>(
                ['appointments', 'by-date', data.date, data.cabinetId],
                (old) => {
                    if (!old) return [data];
                    // Check if appointment already exists (avoid duplicates)
                    const exists = old.some(apt => apt.id === data.id);
                    if (exists) {
                        return old.map(apt => apt.id === data.id ? data : apt);
                    }
                    return [...old, data];
                }
            );
        },
        onError: (error) => {
            console.error('[useCreateAppointment] Error creating appointment:', error);
        },
    });
}

/**
 * Hook to update an existing appointment
 * Optimized: Optimistic update for instant UI feedback
 */
export function useUpdateAppointment() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, { id: number; data: Partial<AppointmentRequest> }>({
        mutationFn: async ({ id, data }) => {
            const response = await appointmentApi.update(id, data);
            return response.data;
        },
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['appointments'] });

            // Snapshot previous values
            const previousAppointment = queryClient.getQueryData<AppointmentResponse>(['appointments', id]);
            const previousList = queryClient.getQueryData<AppointmentResponse[]>([
                'appointments',
                'by-date',
                data.date,
                data.cabinetId,
            ]);

            // Optimistically update single appointment
            if (previousAppointment) {
                queryClient.setQueryData<AppointmentResponse>(['appointments', id], {
                    ...previousAppointment,
                    ...data,
                });
            }

            // Optimistically update appointment in list
            if (previousList && data.date && data.cabinetId) {
                queryClient.setQueryData<AppointmentResponse[]>(
                    ['appointments', 'by-date', data.date, data.cabinetId],
                    previousList.map(apt => apt.id === id ? { ...apt, ...data } : apt)
                );
            }

            return { previousAppointment, previousList, date: data.date, cabinetId: data.cabinetId };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            const ctx = context as { previousAppointment?: AppointmentResponse; previousList?: AppointmentResponse[]; date?: string; cabinetId?: number };
            if (ctx?.previousAppointment) {
                queryClient.setQueryData(['appointments', variables.id], ctx.previousAppointment);
            }
            if (ctx?.previousList && ctx.date && ctx.cabinetId) {
                queryClient.setQueryData(
                    ['appointments', 'by-date', ctx.date, ctx.cabinetId],
                    ctx.previousList
                );
            }
        },
        onSuccess: (data) => {
            // Update with actual server response
            queryClient.setQueryData(['appointments', data.id], data);
            queryClient.setQueryData<AppointmentResponse[]>(
                ['appointments', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.map(apt => apt.id === data.id ? data : apt) : [data]
            );
        },
    });
}

/**
 * Hook to delete an appointment
 * Optimized: Optimistic update for instant UI feedback
 */
export function useDeleteAppointment() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number>({
        mutationFn: async (id: number) => {
            await appointmentApi.delete(id);
        },
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['appointments'] });

            // Snapshot all appointment lists
            const queryCache = queryClient.getQueryCache();
            const previousData = new Map();

            queryCache.findAll({ queryKey: ['appointments', 'by-date'] }).forEach(query => {
                previousData.set(query.queryKey, query.state.data);
            });

            // Optimistically remove from all lists
            queryCache.findAll({ queryKey: ['appointments', 'by-date'] }).forEach(query => {
                queryClient.setQueryData<AppointmentResponse[]>(
                    query.queryKey,
                    (old) => old ? old.filter(apt => apt.id !== id) : []
                );
            });

            return { previousData };
        },
        onError: (err, id, context) => {
            // Rollback all changes on error
            const ctx = context as { previousData?: Map<any, any> };
            if (ctx?.previousData) {
                ctx.previousData.forEach((data: any, queryKey: any) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSuccess: () => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: ['appointments'], exact: false });
        },
    });
}

/**
 * Hook to get current patient in consultation for a specific cabinet and date
 * Optimized: Reduced refetch interval
 */
export function useInConsultation(date: string, cabinetId: number) {
    return useQuery<AppointmentResponse | null, Error>({
        queryKey: ['appointments', 'in-consultation', date, cabinetId],
        queryFn: async () => {
            const response = await appointmentApi.getByDate(date, cabinetId);
            const inConsultation = response.data.find(apt => apt.statutRDV === 'EN_CONSULTATION');
            return inConsultation || null;
        },
        staleTime: 30000, // 30 seconds
        refetchInterval: 30000, // Refetch every 30 seconds (only for active consultation)
        refetchOnWindowFocus: false,
        enabled: !!date && !!cabinetId,
    });
}

/**
 * Hook to update appointment status
 * Optimized: Optimistic update for instant UI feedback
 */
export function useUpdateAppointmentStatus() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, { id: number; status: StatutRDV }>({
        mutationFn: async ({ id, status }) => {
            const response = await appointmentApi.updateStatus(id, status);
            return response.data;
        },
        onMutate: async ({ id, status }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['appointments'] });

            // Snapshot previous values
            const queryCache = queryClient.getQueryCache();
            const previousData = new Map();

            queryCache.findAll({ queryKey: ['appointments'] }).forEach(query => {
                previousData.set(query.queryKey, query.state.data);
            });

            // Optimistically update status in all relevant caches
            queryCache.findAll({ queryKey: ['appointments', 'by-date'] }).forEach(query => {
                queryClient.setQueryData<AppointmentResponse[]>(
                    query.queryKey,
                    (old) => old ? old.map(apt => apt.id === id ? { ...apt, statutRDV: status } : apt) : []
                );
            });

            return { previousData };
        },
        onError: (err, variables, context) => {
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
            queryClient.setQueryData(['appointments', data.id], data);
            queryClient.setQueryData<AppointmentResponse[]>(
                ['appointments', 'by-date', data.date, data.cabinetId],
                (old) => old ? old.map(apt => apt.id === data.id ? data : apt) : [data]
            );

            // Update in-consultation cache
            if (data.statutRDV === 'EN_CONSULTATION') {
                queryClient.setQueryData(
                    ['appointments', 'in-consultation', data.date, data.cabinetId],
                    data
                );
            } else {
                queryClient.setQueryData(
                    ['appointments', 'in-consultation', data.date, data.cabinetId],
                    null
                );
            }
        },
    });
}
