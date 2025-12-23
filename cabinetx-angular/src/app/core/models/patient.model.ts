export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Homme' | 'Femme' | 'Autre';
  phone: string;
  email: string;
  address: string;
  bloodType?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  createdAt: Date;
}
