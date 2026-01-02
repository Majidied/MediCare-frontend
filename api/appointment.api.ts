// CabinetX-UI/CabinetXFrontEnd/api/appointment.api.ts

import apiClient from './client';

// Enums to match backend
export type StatutRDV = 'CONFIRME' | 'EN_CONSULTATION' | 'ANNULE' | 'TERMINE' | 'MISSING';
export type MotifRDV = 'CONSULTATION' | 'CONTROL';

// TypeScript interfaces matching backend DTOs
export interface AppointmentRequest {
    patientId: number;
    cabinetId: number;
    date: string; // LocalDate as string (YYYY-MM-DD)
    Heure_debut: string; // LocalTime as string (HH:mm)
    Heure_fin: string; // LocalTime as string (HH:mm)
    motifRDV: MotifRDV;
    notes?: string;
}

export interface AppointmentResponse extends AppointmentRequest {
    id: number;
    prenom: string;
    nom: string;
    cin: string;
    dateNaissance: string; // LocalDate as string
    statutRDV: StatutRDV;
}

// Frontend-friendly appointment type for UI
export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    date: string;
    time: string;
    motif: MotifRDV;
    status: 'confirmé' | 'en_attente' | 'annulé';
    notes?: string;
}

// Helper functions to convert between backend and frontend formats
export const appointmentHelpers = {
    // Convert backend response to frontend appointment
    toFrontend(response: AppointmentResponse): Appointment {
        // Map backend status to frontend status
        let frontendStatus: 'confirmé' | 'en_attente' | 'annulé';
        switch (response.statutRDV) {
            case 'CONFIRME':
            case 'EN_CONSULTATION':
            case 'TERMINE':
                frontendStatus = 'confirmé';
                break;
            case 'ANNULE':
            case 'MISSING':
                frontendStatus = 'annulé';
                break;
            default:
                frontendStatus = 'en_attente';
                break;
        }

        return {
            id: response.id.toString(),
            patientId: response.patientId.toString(),
            patientName: `${response.prenom} ${response.nom}`,
            date: response.date,
            time: response.Heure_debut.substring(0, 5), // Convert "08:00:00" to "08:00"
            motif: response.motifRDV, // Keep the enum value (CONSULTATION or CONTROL)
            status: frontendStatus,
            notes: response.notes,
        };
    },

    // Convert frontend form data to backend request
    toBackendRequest(
        patientId: number,
        cabinetId: number,
        date: string,
        time: string,
        motif: MotifRDV,
        notes: string
    ): AppointmentRequest {
        // Calculate end time (30 minutes after start)
        const [hours, minutes] = time.split(':').map(Number);
        const endMinutes = minutes + 30;
        const endHours = hours + Math.floor(endMinutes / 60);
        const Heure_fin = `${String(endHours % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

        return {
            patientId,
            cabinetId,
            date,
            Heure_debut: time,
            Heure_fin,
            motifRDV: motif,
            notes: notes || undefined,
        };
    },

    // Convert status for backend
    toBackendStatus(status: string): StatutRDV {
        switch (status) {
            case 'confirmé':
            case 'en_attente':
                return 'CONFIRME';
            case 'annulé':
                return 'ANNULE';
            default:
                return 'CONFIRME';
        }
    },
};

// API Client methods
export const appointmentApi = {
    // Get appointments for a specific date and cabinet
    getByDate: (date: string, cabinetId: number) =>
        apiClient.get<AppointmentResponse[]>('/api/appointments/by-date', {
            params: { date, cabinetId },
        }),

    // Get single appointment by ID
    getById: (id: number) =>
        apiClient.get<AppointmentResponse>(`/api/appointments/${id}`),

    // Create new appointment
    create: (data: AppointmentRequest) =>
        apiClient.post<AppointmentResponse>('/api/appointments/rendezvous', data),

    // Update appointment
    update: (id: number, data: Partial<AppointmentRequest>) =>
        apiClient.put<AppointmentResponse>(`/api/appointments/update/${id}`, data),

    // Delete appointment
    delete: (id: number) =>
        apiClient.delete(`/api/appointments/delete/${id}`),

    // Update appointment status
    updateStatus: (id: number, status: StatutRDV) =>
        apiClient.put<AppointmentResponse>(`/api/appointments/updateStatus/${id}/${status}`, {}),
};
