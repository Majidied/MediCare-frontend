import { Injectable } from '@angular/core';
import { Appointment } from '../models/appointment.model';
import { Cabinet } from '../models/cabinet.model';
import { Consultation } from '../models/consultation.model';
import { Medication } from '../models/medication.model';
import { Patient } from '../models/patient.model';
import { BillingNotification, PatientNotification } from '../models/notification.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly users: User[] = [
    {
      id: 'u1',
      email: 'admin@cabinetx.com',
      password: 'admin123',
      name: 'Admin Principal',
      role: 'admin',
      phone: '+33612345678',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'u2',
      email: 'medecin@cabinetx.com',
      password: 'medecin123',
      name: 'Dr. Martin Dubois',
      role: 'medecin',
      phone: '+33623456789',
      specialite: 'Médecine Générale',
      cabinetId: 'c1',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'u3',
      email: 'secretaire@cabinetx.com',
      password: 'secretaire123',
      name: 'Sophie Laurent',
      role: 'secretaire',
      phone: '+33634567890',
      cabinetId: 'c1',
      createdAt: new Date('2024-01-15'),
    },
  ];

  private readonly cabinets: Cabinet[] = [
    {
      id: 'c1',
      name: 'Cabinet Médical Central',
      address: '123 Avenue des Champs',
      city: 'Paris',
      postalCode: '75008',
      phone: '+33145678901',
      email: 'contact@cabinet-central.fr',
      plan: 'Premium',
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date('2025-12-31'),
      monthlyFee: 199.99,
      mapPosition: { x: 45, y: 30 },
      createdAt: new Date('2024-01-01'),
    },
  ];

  private readonly patients: Patient[] = [
    {
      id: 'p1',
      firstName: 'Alice',
      lastName: 'Durand',
      dateOfBirth: new Date('1990-05-12'),
      gender: 'Femme',
      phone: '+33600011122',
      email: 'alice.durand@example.com',
      address: '12 Rue de la Paix, Paris',
      bloodType: 'A+',
      allergies: ['Pénicilline'],
      chronicDiseases: ['Asthme'],
      emergencyContact: {
        name: 'Marc Durand',
        phone: '+33600033344',
        relation: 'Conjoint',
      },
      createdAt: new Date('2024-01-10'),
    },
    {
      id: 'p2',
      firstName: 'Karim',
      lastName: 'El Haddad',
      dateOfBirth: new Date('1985-02-20'),
      gender: 'Homme',
      phone: '+33622244466',
      email: 'karim.haddad@example.com',
      address: '8 Boulevard Saint-Germain, Paris',
      bloodType: 'O-',
      allergies: [],
      chronicDiseases: ['Hypertension'],
      createdAt: new Date('2024-02-15'),
    },
  ];

  private readonly appointments: Appointment[] = [
    {
      id: 'a1',
      patientId: 'p1',
      medecinId: 'u2',
      date: new Date(),
      timeSlot: '09:00',
      duration: 30,
      motif: 'Suivi annuel',
      urgency: 'normal',
      status: 'scheduled',
      createdAt: new Date(),
    },
  ];

  private readonly consultations: Consultation[] = [
    {
      id: 'cons1',
      patientId: 'p1',
      medecinId: 'u2',
      appointmentId: 'a1',
      date: new Date(),
      motif: 'Suivi annuel',
      symptoms: 'Fatigue légère',
      diagnosis: 'Aucun problème majeur',
      treatment: 'Repos et hydratation',
      status: 'completed',
      prescriptions: [],
      createdAt: new Date(),
    },
  ];

  private readonly medications: Medication[] = [
    {
      id: 'm1',
      name: 'Paracétamol',
      form: 'Comprimé',
      dosage: '500mg',
      laboratory: 'Sanofi',
      description: 'Antalgique et antipyrétique',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'm2',
      name: 'Ibuprofène',
      form: 'Comprimé',
      dosage: '400mg',
      laboratory: 'Pfizer',
      description: 'Anti-inflammatoire non stéroïdien',
      createdAt: new Date('2024-02-01'),
    },
  ];

  private readonly patientNotifications: PatientNotification[] = [
    {
      id: 'pn1',
      patientId: 'p1',
      appointmentId: 'a1',
      message: 'Alice Durand est prête pour consultation',
      urgency: 'normal',
      isRead: false,
      createdAt: new Date(),
    },
  ];

  private readonly billingNotifications: BillingNotification[] = [
    {
      id: 'bn1',
      consultationId: 'cons1',
      patientId: 'p1',
      medecinId: 'u2',
      isProcessed: false,
      invoiceGenerated: false,
      createdAt: new Date(),
    },
  ];

  getUsers(): User[] {
    return this.clone(this.users);
  }

  getUserByCredentials(email: string, password: string): User | null {
    const match = this.users.find((user) => user.email === email && user.password === password);
    return match ? { ...match } : null;
  }

  getPatients(): Patient[] {
    return this.clone(this.patients);
  }

  getAppointments(): Appointment[] {
    return this.clone(this.appointments);
  }

  getConsultations(): Consultation[] {
    return this.clone(this.consultations);
  }

  getMedications(): Medication[] {
    return this.clone(this.medications);
  }

  getCabinets(): Cabinet[] {
    return this.clone(this.cabinets);
  }

  getPatientNotifications(): PatientNotification[] {
    return this.clone(this.patientNotifications);
  }

  getBillingNotifications(): BillingNotification[] {
    return this.clone(this.billingNotifications);
  }

  private clone<T>(value: T): T {
    return structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }
}
