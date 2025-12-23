export type MedicationForm =
  | 'Comprimé'
  | 'Sirop'
  | 'Injection'
  | 'Gélule'
  | 'Pommade'
  | 'Autre';

export interface Medication {
  id: string;
  name: string;
  form: MedicationForm;
  dosage: string;
  laboratory: string;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  createdAt: Date;
}
