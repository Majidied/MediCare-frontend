export type UserRole = 'admin' | 'medecin' | 'secretaire';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  specialite?: string;
  cabinetId?: string;
  createdAt: Date;
}
