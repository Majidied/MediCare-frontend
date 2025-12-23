export interface PrescriptionMedication {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  medications: PrescriptionMedication[];
  instructions: string;
  createdAt: Date;
}

export type ConsultationStatus = 'in-progress' | 'completed';

export interface Consultation {
  id: string;
  patientId: string;
  medecinId: string;
  appointmentId?: string;
  date: Date;
  motif: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescriptions?: Prescription[];
  status: ConsultationStatus;
  createdAt: Date;
}
