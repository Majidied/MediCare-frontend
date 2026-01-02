// CabinetX-UI/CabinetXFrontEnd/hooks/use-appointment.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, AppointmentRequest, AppointmentResponse, appointmentHelpers, Appointment } from '@/api/appointment.api';

/**
 * Hook to fetch appointments by date and cabinet
 */
export function useAppointmentsByDate(date: string, cabinetId: number) {
    return useQuery<AppointmentResponse[], Error>({
        queryKey: ['appointments', 'by-date', date, cabinetId],
        queryFn: async () => {
            const response = await appointmentApi.getByDate(date, cabinetId);
            return response.data;
        },
        staleTime: 30000, // Consider data fresh for 30 seconds
        enabled: !!date && !!cabinetId, // Only run query if date and cabinetId are provided
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
        enabled: !!id,
    });
}

/**
 * Hook to create a new appointment
 */
export function useCreateAppointment() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, AppointmentRequest>({
        mutationFn: async (data: AppointmentRequest) => {
            const response = await appointmentApi.create(data);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate and refetch appointments for the specific date and cabinet
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'by-date', data.date, data.cabinetId],
            });
            queryClient.invalidateQueries({
                queryKey: ['appointments'],
            });
        },
    });
}

/**
 * Hook to update an existing appointment
 */
export function useUpdateAppointment() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, { id: number; data: Partial<AppointmentRequest> }>({
        mutationFn: async ({ id, data }) => {
            const response = await appointmentApi.update(id, data);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate specific appointment and list queries
            queryClient.invalidateQueries({
                queryKey: ['appointments', data.id],
            });
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'by-date'],
            });
        },
    });
}

/**
 * Hook to delete an appointment
 */
export function useDeleteAppointment() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number>({
        mutationFn: async (id: number) => {
            await appointmentApi.delete(id);
        },
        onSuccess: () => {
            // Invalidate all appointment queries
            queryClient.invalidateQueries({
                queryKey: ['appointments'],
            });
        },
    });
}

/**
 * Hook to update appointment status
 */
export function useUpdateAppointmentStatus() {
    const queryClient = useQueryClient();

    return useMutation<AppointmentResponse, Error, { id: number; status: 'CONFIRME' | 'EN_CONSULTATION' | 'ANNULE' | 'TERMINE' | 'MISSING' }>({
        mutationFn: async ({ id, status }) => {
            const response = await appointmentApi.updateStatus(id, status);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate specific appointment and list queries
            queryClient.invalidateQueries({
                queryKey: ['appointments', data.id],
            });
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'by-date'],
            });
        },
    });
}
