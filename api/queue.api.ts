// CabinetX-UI/CabinetXFrontEnd/api/queue.api.ts

import apiClient from './client';
import { AppointmentResponse } from './appointment.api';

// Queue reorder request DTO
export interface ReorderQueueRequest {
    cabinetId: number;
    date: string; // YYYY-MM-DD
    appointmentIds: number[];
}

// API Client methods for Queue management
export const queueApi = {
    // Get queue for a specific date and cabinet
    getByDate: (date: string, cabinetId: number) =>
        apiClient.get<AppointmentResponse[]>('/api/queue/by-date', {
            params: { date, cabinetId },
        }),

    // Add appointment to queue (change status to EN_ATTENTE)
    addToQueue: (appointmentId: number) =>
        apiClient.put<AppointmentResponse>(`/api/queue/add/${appointmentId}`, {}),

    // Remove appointment from queue (back to CONFIRME)
    removeFromQueue: (appointmentId: number) =>
        apiClient.put<AppointmentResponse>(`/api/queue/remove/${appointmentId}`, {}),

    // Call next patient (move to EN_CONSULTATION)
    callNext: (appointmentId: number) =>
        apiClient.put<AppointmentResponse>(`/api/queue/call-next/${appointmentId}`, {}),

    // Reorder queue (for drag & drop)
    reorderQueue: (data: ReorderQueueRequest) =>
        apiClient.post<AppointmentResponse[]>('/api/queue/reorder', data),
};
