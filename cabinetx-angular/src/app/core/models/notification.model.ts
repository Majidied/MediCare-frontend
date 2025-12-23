export interface PatientNotification {
  id: string;
  patientId: string;
  appointmentId: string;
  message: string;
  urgency: 'normal' | 'urgent' | 'urgence';
  isRead: boolean;
  createdAt: Date;
}

export interface BillingNotification {
  id: string;
  consultationId: string;
  patientId: string;
  medecinId: string;
  amount?: number;
  paymentMethod?: 'Espèces' | 'Carte bancaire' | 'Chèque' | 'Virement';
  isProcessed: boolean;
  invoiceGenerated: boolean;
  createdAt: Date;
}
