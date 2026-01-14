// CabinetX-UI/CabinetXFrontEnd/api/notification.api.ts

import apiClient from './client';

// Notification types matching backend
export type NotificationType = 'PATIENT_FOLLOWING' | 'SUBSCRIPTION_EXPIRATION_ALERT' | 'PATIENT_CONSULTATION' | 'BILLING_READY';
export type NotificationStatus = 'PENDING' | 'READ';

// Backend notification response
export interface NotificationResponse {
    id: number;
    recipientId: number;
    type: NotificationType;
    title: string;
    content: string;
    status: NotificationStatus;
    creationDate: string; // ISO string
    readDate?: string; // ISO string
    patientId?: number;
    appointmentId?: number;
    consultationId?: number;
}

// Frontend notification interface
export interface Notification {
    id: string;
    recipientId: number;
    type: NotificationType;
    title: string;
    content: string;
    status: 'pending' | 'read';
    createdAt: string;
    readAt?: string;
    patientId?: number;
    appointmentId?: number;
    consultationId?: number;
}

// Helper to convert backend to frontend format
export const notificationHelpers = {
    toFrontend(response: NotificationResponse): Notification {
        return {
            id: response.id.toString(),
            recipientId: response.recipientId,
            type: response.type,
            title: response.title,
            content: response.content,
            status: response.status === 'PENDING' ? 'pending' : 'read',
            createdAt: response.creationDate,
            readAt: response.readDate,
            patientId: response.patientId,
            appointmentId: response.appointmentId,
            consultationId: response.consultationId,
        };
    },
};

// API Client methods
export const notificationApi = {
    // Get all notifications for a user
    getByRecipient: (recipientId: number) => {
        console.log('Fetching notifications for recipientId:', recipientId);
        const a = apiClient.get<NotificationResponse[]>(`/api/notifications/${recipientId}`);
        console.log('Fetching notifications for recipientId:', recipientId, 'Response:', a);
        return a;
    },

    // Get unread notifications for a user
    getUnread: (recipientId: number) =>
        apiClient.get<NotificationResponse[]>(`/api/notifications/${recipientId}/unread`),

    // Mark notification as read
    markAsRead: (notificationId: number) =>
        apiClient.put<NotificationResponse>(`/api/notifications/${notificationId}/read`),

    // Send patient consultation notification (for testing/manual trigger)
    sendPatientConsultation: (params: {
        doctorId: number;
        appointmentId: number;
        patientName: string;
        patientAge: number;
        reason: string;
        appointmentTime: string;
    }) =>
        apiClient.post<NotificationResponse>('/api/notifications/patient-consultation', null, {
            params,
        }),

    // Request next patient - send notification to secretary
    requestNextPatient: (params: {
        doctorId: number;
        doctorName: string;
        clinicId: number;
    }) =>
        apiClient.post<NotificationResponse>('/api/notifications/request-next-patient', null, {
            params,
        }),
};
