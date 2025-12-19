export type UserRole = "medecin" | "secretaire" | "admin"

export interface User {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  avatar?: string
  cabinetId?: string // Link user to cabinet
}

export const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "medecin@cabinetx.com",
    password: "medecin123",
    name: "Dr. Sarah Martin",
    role: "medecin",
    cabinetId: "cab1",
  },
  {
    id: "2",
    email: "secretaire@cabinetx.com",
    password: "secretaire123",
    name: "Marie Dubois",
    role: "secretaire",
    cabinetId: "cab1",
  },
  {
    id: "3",
    email: "admin@cabinetx.com",
    password: "admin123",
    name: "Jean Dupont",
    role: "admin",
  },
  {
    id: "4",
    email: "medecin2@cabinetx.com",
    password: "medecin123",
    name: "Dr. Pierre Lefebvre",
    role: "medecin",
    cabinetId: "cab2",
  },
  {
    id: "5",
    email: "secretaire2@cabinetx.com",
    password: "secretaire123",
    name: "Sophie Laurent",
    role: "secretaire",
    cabinetId: "cab3",
  },
]

export const authenticateUser = (email: string, password: string): User | null => {
  const user = MOCK_USERS.find((u) => u.email === email && u.password === password)
  return user || null
}

export interface Medication {
  id: string
  name: string
  dosage: string
  form: string
  description?: string
}

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: "1",
    name: "Paracétamol",
    dosage: "500mg",
    form: "Comprimé",
    description: "Analgésique et antipyrétique pour le traitement de la douleur et de la fièvre",
  },
  {
    id: "2",
    name: "Ibuprofène",
    dosage: "400mg",
    form: "Comprimé",
    description: "Anti-inflammatoire non stéroïdien pour le traitement de la douleur et de l'inflammation",
  },
  {
    id: "3",
    name: "Amoxicilline",
    dosage: "1g",
    form: "Gélule",
    description: "Antibiotique à large spectre de la famille des pénicillines",
  },
  {
    id: "4",
    name: "Doliprane",
    dosage: "1000mg",
    form: "Comprimé effervescent",
    description: "Analgésique et antipyrétique à base de paracétamol",
  },
  {
    id: "5",
    name: "Ventoline",
    dosage: "100mcg",
    form: "Spray",
    description: "Bronchodilatateur pour le traitement de l'asthme",
  },
]

export interface Consultation {
  id: string
  date: string
  motif: string
  diagnostic: string
  traitement: string
  notes?: string
  ordonnance?: Ordonnance
  status?: "en_cours" | "terminee"
  actes?: string[]
}

export interface Ordonnance {
  id: string
  consultationId: string
  date: string
  medications: Array<{
    name: string
    dosage: string
    posologie: string
    duree: string
  }>
}

export interface Patient {
  id: string
  name: string
  cin: string
  dateOfBirth: string
  phone: string
  email: string
  address: string
  mutuelle?: string
  status: "Actif" | "Inactif"
  consultations?: Consultation[]
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "1",
    name: "Ahmed Benali",
    cin: "AB123456",
    dateOfBirth: "1985-03-15",
    phone: "+212 6 12 34 56 78",
    email: "ahmed.benali@email.com",
    address: "123 Rue Hassan II, Casablanca",
    mutuelle: "CNSS",
    status: "Actif",
    consultations: [
      {
        id: "c1",
        date: "2025-01-15",
        motif: "Grippe",
        diagnostic: "Syndrome grippal avec fièvre",
        traitement: "Paracétamol 1g 3x/jour pendant 5 jours",
        notes: "Repos recommandé",
        status: "en_cours",
      },
    ],
  },
  {
    id: "2",
    name: "Fatima Zahra",
    cin: "FZ789012",
    dateOfBirth: "1990-07-22",
    phone: "+212 6 98 76 54 32",
    email: "fatima.zahra@email.com",
    address: "456 Avenue Mohammed V, Rabat",
    mutuelle: "CNOPS",
    status: "Actif",
    consultations: [],
  },
  {
    id: "3",
    name: "Mohammed Alami",
    cin: "MA345678",
    dateOfBirth: "1978-11-08",
    phone: "+212 6 11 22 33 44",
    email: "mohammed.alami@email.com",
    address: "789 Boulevard Zerktouni, Marrakech",
    status: "Actif",
    consultations: [],
  },
  {
    id: "4",
    name: "Khadija Idrissi",
    cin: "KI901234",
    dateOfBirth: "1995-05-30",
    phone: "+212 6 55 66 77 88",
    email: "khadija.idrissi@email.com",
    address: "321 Rue de Fès, Tanger",
    mutuelle: "CNSS",
    status: "Actif",
    consultations: [],
  },
  {
    id: "5",
    name: "Youssef Tazi",
    cin: "YT567890",
    dateOfBirth: "1982-09-17",
    phone: "+212 6 44 55 66 77",
    email: "youssef.tazi@email.com",
    address: "654 Avenue Atlas, Agadir",
    status: "Inactif",
    consultations: [],
  },
]

export interface Cabinet {
  id: string
  name: string
  address: string
  phone: string
  email: string
  city: string
  country: string
  postalCode: string
  status: "Actif" | "Inactif"
  subscriptionPlan: "Basic" | "Premium" | "Enterprise"
  subscriptionEndDate: string
  userIds: string[] // IDs of users linked to this cabinet
  createdAt: string
}

export const MOCK_CABINETS: Cabinet[] = [
  {
    id: "cab1",
    name: "Cabinet Santé Plus",
    address: "123 Avenue Hassan II",
    phone: "+212 5 22 12 34 56",
    email: "contact@santeplus.ma",
    city: "Casablanca",
    country: "Maroc",
    postalCode: "20000",
    status: "Actif",
    subscriptionPlan: "Premium",
    subscriptionEndDate: "2025-12-31",
    userIds: ["1", "2"],
    createdAt: "2024-01-15",
  },
  {
    id: "cab2",
    name: "Clinique Atlas",
    address: "456 Boulevard Mohammed V",
    phone: "+212 5 37 45 67 89",
    email: "info@cliniqueatlas.ma",
    city: "Rabat",
    country: "Maroc",
    postalCode: "10000",
    status: "Actif",
    subscriptionPlan: "Enterprise",
    subscriptionEndDate: "2025-06-30",
    userIds: ["4"],
    createdAt: "2024-03-20",
  },
  {
    id: "cab3",
    name: "Centre Médical Oasis",
    address: "789 Rue de Fès",
    phone: "+212 5 24 33 22 11",
    email: "contact@medicaloasis.ma",
    city: "Marrakech",
    country: "Maroc",
    postalCode: "40000",
    status: "Actif",
    subscriptionPlan: "Basic",
    subscriptionEndDate: "2025-09-15",
    userIds: ["5"],
    createdAt: "2024-05-10",
  },
  {
    id: "cab4",
    name: "Cabinet Méditerranée",
    address: "321 Avenue Ibn Batouta",
    phone: "+212 5 39 88 99 77",
    email: "accueil@mediterranee.ma",
    city: "Tanger",
    country: "Maroc",
    postalCode: "90000",
    status: "Inactif",
    subscriptionPlan: "Basic",
    subscriptionEndDate: "2024-12-31",
    userIds: [],
    createdAt: "2023-11-05",
  },
]
