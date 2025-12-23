export type AppointmentUrgency = 'normal' | 'urgent' | 'urgence';
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'absent';

export interface Appointment {
  id: string;
  patientId: string;
  medecinId: string;
  date: Date;
  timeSlot: string;
  duration: number;
  motif: string;
  urgency: AppointmentUrgency;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
}
