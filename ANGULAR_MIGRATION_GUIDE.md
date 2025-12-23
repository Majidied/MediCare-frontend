# Guide de Migration CabinetX vers Angular

## Vue d'Ensemble du Projet

**Nom**: CabinetX
**Type**: Application de gestion de cabinet médical multi-rôles
**Style**: Futuriste avec thème médical vert néon
**Rôles**: Admin (plateforme), Médecin, Secrétaire

---

## Architecture Technique Angular

### Stack Requis
- **Angular 17+** avec Standalone Components
- **TypeScript 5+**
- **Tailwind CSS v4** avec configuration inline dans styles.css
- **Angular Material** ou **PrimeNG** pour composants UI de base
- **RxJS** pour gestion d'état et notifications
- **Angular Router** avec guards pour protection des routes
- **LocalStorage** pour persistance d'authentification mock

### Structure des Dossiers
```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── mock-data.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── patient.model.ts
│   │       ├── appointment.model.ts
│   │       ├── consultation.model.ts
│   │       ├── medication.model.ts
│   │       └── cabinet.model.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── dashboard-layout/
│   │   │   ├── theme-toggle/
│   │   │   └── floating-medical-elements/
│   │   └── directives/
│   ├── features/
│   │   ├── auth/
│   │   │   └── login/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── medications/
│   │   │   └── cabinets/
│   │   ├── medecin/
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── notifications/
│   │   │   └── paiements/
│   │   └── secretaire/
│   │       ├── dashboard/
│   │       ├── queue/
│   │       ├── patients/
│   │       ├── notifications/
│   │       └── rendez-vous/
│   └── app.routes.ts
├── assets/
└── styles.css
```

---

## Système de Design Futuriste Médical

### Palette de Couleurs (Tailwind CSS v4 - @theme inline)

```css
@theme inline {
  /* Couleurs Primaires - Vert Médical Futuriste */
  --color-primary: oklch(0.65 0.18 155);
  --color-primary-dark: oklch(0.45 0.15 160);
  --color-primary-light: oklch(0.85 0.10 150);
  
  /* Couleurs d'Accent */
  --color-accent: oklch(0.75 0.22 150);
  --color-secondary: oklch(0.55 0.18 230);
  
  /* Couleurs Neutres Mode Clair */
  --color-background: oklch(0.98 0.01 155);
  --color-foreground: oklch(0.15 0.02 160);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.15 0.02 160);
  --color-muted: oklch(0.94 0.02 155);
  --color-muted-foreground: oklch(0.45 0.01 155);
  --color-border: oklch(0.88 0.02 155);
  
  /* Couleurs Neutres Mode Sombre */
  --color-background-dark: oklch(0.12 0.02 160);
  --color-foreground-dark: oklch(0.95 0 0);
  --color-card-dark: oklch(0.18 0.02 155);
  --color-card-foreground-dark: oklch(0.95 0 0);
  --color-muted-dark: oklch(0.22 0.02 155);
  --color-muted-foreground-dark: oklch(0.65 0.01 155);
  --color-border-dark: oklch(0.25 0.03 155);
  
  /* Couleurs d'État */
  --color-success: oklch(0.70 0.20 145);
  --color-warning: oklch(0.72 0.18 80);
  --color-error: oklch(0.60 0.22 20);
  --color-info: oklch(0.62 0.20 230);
  
  /* Typographie */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  
  /* Radius */
  --radius: 0.75rem;
}
```

### Typographie
- **Font Principale**: Inter (Google Fonts)
- **Font Mono**: Fira Code
- **Hiérarchie**:
  - H1: text-3xl font-semibold tracking-tight
  - H2: text-2xl font-semibold
  - H3: text-xl font-semibold
  - Body: text-base leading-relaxed
  - Small: text-sm
  - Labels: text-sm font-medium uppercase tracking-wide

### Effets Visuels Futuristes
1. **Glassmorphism**: `backdrop-blur-xl bg-white/10 dark:bg-white/5`
2. **Glow Effects**: `shadow-lg shadow-primary/50`
3. **Gradient Borders**: Utiliser `border-image` avec gradients verts
4. **Animations**: 
   - `transition-all duration-300 ease-in-out`
   - Hover scale: `hover:scale-105`
   - Pulse pour notifications: `animate-pulse`

---

## Modèles de Données (TypeScript Interfaces)

### User Model
```typescript
export interface User {
  id: string;
  email: string;
  password: string; // En mock, en prod utiliser hash
  name: string;
  role: 'admin' | 'medecin' | 'secretaire';
  phone?: string;
  specialite?: string; // Pour médecins
  cabinetId?: string; // Pour lier au cabinet
  createdAt: Date;
}
```

### Cabinet Model
```typescript
export interface Cabinet {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  plan: 'Basique' | 'Standard' | 'Premium';
  subscriptionStatus: 'active' | 'suspended' | 'trial';
  subscriptionEndDate: Date;
  monthlyFee: number;
  mapPosition: { x: number; y: number }; // Pour affichage carte
  createdAt: Date;
}
```

### Patient Model
```typescript
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
```

### Appointment Model
```typescript
export interface Appointment {
  id: string;
  patientId: string;
  medecinId: string;
  date: Date;
  timeSlot: string; // Format: "09:00"
  duration: number; // En minutes, fixé à 30
  motif: string;
  urgency: 'normal' | 'urgent' | 'urgence';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'absent';
  notes?: string;
  createdAt: Date;
}
```

### Consultation Model
```typescript
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
  status: 'in-progress' | 'completed';
  createdAt: Date;
}

export interface Prescription {
  id: string;
  consultationId: string;
  medications: PrescriptionMedication[];
  instructions: string;
  createdAt: Date;
}

export interface PrescriptionMedication {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
}
```

### Medication Model
```typescript
export interface Medication {
  id: string;
  name: string;
  form: 'Comprimé' | 'Sirop' | 'Injection' | 'Gélule' | 'Pommade' | 'Autre';
  dosage: string;
  laboratory: string;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  createdAt: Date;
}
```

### Notification Models
```typescript
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
```

---

## Services Angular

### AuthService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('cabinetx_user');
    if (userJson) {
      this.currentUserSubject.next(JSON.parse(userJson));
    }
    this.isLoadingSubject.next(false);
  }

  login(email: string, password: string): Observable<User> {
    // Vérifier contre mockUsers
    // Sauvegarder dans localStorage
    // Retourner Observable
  }

  logout(): void {
    localStorage.removeItem('cabinetx_user');
    this.currentUserSubject.next(null);
  }
}
```

### NotificationsService
```typescript
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private patientNotificationsSubject = new BehaviorSubject<PatientNotification[]>([]);
  public patientNotifications$ = this.patientNotificationsSubject.asObservable();
  
  private billingNotificationsSubject = new BehaviorSubject<BillingNotification[]>([]);
  public billingNotifications$ = this.billingNotificationsSubject.asObservable();

  public unreadPatientCount$ = this.patientNotifications$.pipe(
    map(notifications => notifications.filter(n => !n.isRead).length)
  );

  public unreadBillingCount$ = this.billingNotifications$.pipe(
    map(notifications => notifications.filter(n => !n.isProcessed).length)
  );

  // Méthodes CRUD pour notifications
}
```

---

## Architecture des Pages et Fonctionnalités

### 1. Page de Login (/)

**Composant**: `LoginComponent`

**Design**:
- Fond avec animation d'éléments médicaux flottants (stéthoscope, cœur, croix, pilules)
- 4 blobs animés de couleurs différentes en arrière-plan
- Grille futuriste en motif de fond
- Formulaire central avec effet glassmorphism
- Logo "CabinetX" en haut avec icône Stethoscope
- Toggle mode sombre en haut à droite

**Fonctionnalités**:
- Formulaire avec email et mot de passe
- Validation des champs obligatoires
- Affichage des credentials de démo:
  - Admin: admin@cabinetx.com / admin123
  - Médecin: medecin@cabinetx.com / medecin123
  - Secrétaire: secretaire@cabinetx.com / secretaire123
- Redirection selon rôle après login réussi

**Animations**:
- 25 éléments médicaux flottants avec animations rotate et translate
- 4 blobs avec animations pulse et float
- Transition hover sur bouton avec scale et glow effect

---

### 2. Layout Dashboard (Shared Component)

**Composant**: `DashboardLayoutComponent`

**Structure**:
```
┌─────────────────────────────────────────────┐
│ Navbar (top)                                │
│ [Logo] [Toggle Theme] [Notifs] [Profile]   │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Content (router-outlet)        │
│ (left)   │                                  │
│          │                                  │
│ [Nav     │                                  │
│  Links]  │                                  │
│          │                                  │
│ [Profile]│                                  │
└──────────┴──────────────────────────────────┘
```

**Navbar**:
- Logo CabinetX avec lien vers dashboard
- Toggle thème (Soleil/Lune) avec animation
- Badge de notifications avec compteur rouge animé (seulement pour Médecin et Secrétaire)
  - Médecin: Compte `unreadPatientCount`
  - Secrétaire: Compte `unreadBillingCount`
- Dropdown profil avec:
  - Nom et rôle de l'utilisateur
  - Bouton "Déconnexion" avec icône LogOut

**Sidebar**:
- Liens de navigation selon le rôle (voir détails ci-dessous)
- Icônes avec labels
- Highlight du lien actif
- Section profil en bas avec avatar et nom

**Responsive**:
- Mobile: Sidebar collapse avec hamburger menu
- Tablet: Sidebar mini avec icônes seulement
- Desktop: Sidebar complète

---

### 3. Espace Admin

#### 3.1 Dashboard Admin (/dashboard/admin)

**Composant**: `AdminDashboardComponent`

**Statistiques (Cards)**:
1. Utilisateurs Totaux (icône Users)
2. Cabinets Actifs (icône Building2)
3. Rendez-vous du Jour (icône Calendar)
4. Revenus Mensuels (icône DollarSign)

**Graphiques**:
- Chart des utilisateurs par rôle (Bar Chart)
- Chart des cabinets par plan (Pie Chart)

**Design**:
- Cards avec effet glassmorphism
- Badges colorés pour statistiques
- Animations hover avec scale et glow

#### 3.2 Gestion des Utilisateurs (/dashboard/admin/users)

**Composant**: `AdminUsersComponent`

**Vue**:
- Statistiques en haut: Total par rôle
- Barre de recherche
- Tableau avec colonnes:
  - Avatar + Nom
  - Email
  - Rôle (Badge coloré)
  - Cabinet (si assigné)
  - Téléphone
  - Date de création
  - Actions (Éditer, Supprimer)

**Fonctionnalités**:
- Bouton "Nouvel utilisateur" ouvre Dialog
- Formulaire de création/édition avec validation:
  - Nom (requis)
  - Email (requis, format email, unique)
  - Mot de passe (requis en création, min 6 caractères)
  - Téléphone (format: +XXX...)
  - Rôle (select: Admin, Médecin, Secrétaire)
  - Cabinet (select, optionnel)
  - Spécialité (si Médecin)
- Messages d'erreur sous chaque champ invalide
- Toast de confirmation après actions

#### 3.3 Gestion des Médicaments (/dashboard/admin/medications)

**Composant**: `AdminMedicationsComponent`

**Vue**:
- Statistiques par forme de médicament
- Barre de recherche
- Grille de cards (3 colonnes desktop, 1 mobile):
  - Nom du médicament
  - Forme (Badge)
  - Dosage
  - Laboratoire
  - Boutons: Éditer, Supprimer

**Fonctionnalités**:
- Dialog pour création/édition avec validation:
  - Nom (requis)
  - Forme (select requis)
  - Dosage (requis)
  - Laboratoire (requis)
  - Description (textarea, optionnel)
  - Effets secondaires (textarea, optionnel)
  - Contre-indications (textarea, optionnel)

#### 3.4 Gestion des Cabinets (/dashboard/admin/cabinets)

**Composant**: `AdminCabinetsComponent`

**Vue Principale - Map Interactive**:
- Fond avec grille de map stylisée
- Toggle entre "Vue Carte" et "Vue Grille"
- En mode Carte:
  - Affichage visuel comme une vraie carte avec marqueurs
  - Chaque cabinet est un marqueur avec position (x, y)
  - Animation pulse sur marqueurs
  - Couleur selon statut (vert=actif, orange=trial, rouge=suspendu)
- En mode Grille:
  - Cards classiques 3 colonnes

**Card Cabinet**:
- Nom du cabinet
- Adresse complète
- Badge de plan (Basique/Standard/Premium)
- Badge de statut
- Nombre d'utilisateurs assignés
- Boutons: Voir détails, Éditer, Supprimer

**Dialog Détails Cabinet**:
- Informations complètes du cabinet
- Section "Utilisateurs Assignés":
  - Liste des utilisateurs avec avatar, nom, rôle
  - Bouton "Retirer" pour chaque utilisateur
- Section "Assigner Utilisateur":
  - Select avec liste des utilisateurs non assignés
  - Bouton "Assigner"

**Formulaire Création/Édition**:
- Nom (requis)
- Adresse, Ville, Code Postal (requis)
- Téléphone (format validé)
- Email (format validé)
- Plan (select: Basique, Standard, Premium)
- Statut d'abonnement
- Date de fin d'abonnement
- Frais mensuels (nombre)

**Liens Navigation Sidebar Admin**:
1. Dashboard (Home)
2. Utilisateurs (Users)
3. Médicaments (Pill)
4. Cabinets (Building2)

---

### 4. Espace Médecin

#### 4.1 Dashboard Médecin (/dashboard/medecin)

**Composant**: `MedecinDashboardComponent`

**Statistiques**:
1. Consultations du Jour
2. Patients Actifs
3. Rendez-vous Aujourd'hui
4. Ordonnances Rédigées

**Sections**:
1. **Rendez-vous du Jour**:
   - Liste avec heure, patient, motif, badge d'urgence
2. **Consultations Récentes**:
   - 5 dernières consultations avec date, patient, diagnostic
3. **Statistiques Hebdomadaires**:
   - Barres de progression pour consultations par jour

**Actions Rapides**:
- Boutons vers: Patients, Notifications, Demander Patient Suivant

#### 4.2 Patients (/dashboard/medecin/patients)

**Composant**: `MedecinPatientsComponent`

**Vue Liste**:
- Barre de recherche
- Statistiques: Total patients
- Grille de cards patients:
  - Avatar avec initiales
  - Nom complet
  - Âge et sexe
  - Dernière visite
  - Bouton "Voir dossier"

**Responsive**: 3 colonnes desktop, 2 tablet, 1 mobile

#### 4.3 Dossier Patient (/dashboard/medecin/patients/:id)

**Composant**: `MedecinPatientDetailsComponent`

**Structure en Tabs**:

**Tab 1: Informations Personnelles**
- Card avec toutes les infos du patient
- Affichage en lecture seule (pas d'édition pour médecin)

**Tab 2: Dossier Médical**
- Section "Consultations":
  - Liste des consultations
  - Pour chaque consultation:
    - Date, motif, diagnostic, traitement
    - Badge statut (En cours/Terminée)
    - Boutons: Éditer (si en cours), Supprimer (si en cours), Terminer
  - Dialog création consultation avec validation
  - Dialog édition consultation (seulement si en cours)
  - Bouton "Terminer la consultation":
    - Marque comme terminée
    - Désactive édition/suppression
    - Envoie notification de facturation à secrétaire

- Section "Ordonnances":
  - Liste des ordonnances avec médicaments
  - Dialog création ordonnance:
    - Select médicaments depuis référentiel
    - Ajout multiple de médicaments
    - Pour chaque médicament: Dosage, Fréquence, Durée
    - Instructions générales
  - Bouton "Imprimer" ouvre dialog avec ordonnance formatée
  - Format ordonnance:
    - En-tête: Cabinet, Dr [Nom], Date
    - Patient: Nom, Âge
    - Liste médicaments avec posologie
    - Instructions
    - Signature médecin

#### 4.4 Notifications (/dashboard/medecin/notifications)

**Composant**: `MedecinNotificationsComponent`

**Vue**:
- Tabs: "Non traitées" et "Historique"
- Cards notifications non lues:
  - Infos patient (nom, âge)
  - Motif RDV
  - Heure du RDV
  - Badge urgence (rouge=urgence, orange=urgent, vert=normal)
  - Bouton "Voir dossier" → Redirige vers `/dashboard/medecin/patients/:id`
    - Marque notification comme lue automatiquement

**Comportement**:
- Clic sur "Voir dossier" :
  - Appelle `notificationsService.markAsRead(notificationId)`
  - Navigate vers page patient
  - Décrémente compteur badge navbar

#### 4.5 Paiements Cabinet (/dashboard/medecin/paiements)

**Composant**: `MedecinPaiementsComponent`

**Vue**:
- Card principale: Statut abonnement cabinet
  - Nom du plan
  - Montant mensuel
  - Jours restants avant renouvellement
  - Barre de progression du temps restant
  - Badge statut (Actif/En trial/Suspendu)
  - Bouton "Payer l'abonnement" → Intégration Stripe

- Section "Historique des paiements":
  - Tableau avec date, montant, statut, facture
  - Paiements passés et prochains

**Navbar Médecin - Bouton Spécial**:
- Bouton "Patient Suivant" (à côté notifications)
- Au clic:
  - Affiche toast: "Notification envoyée à la secrétaire"
  - Redirige vers dashboard médecin
  - NE marque PAS les notifications comme lues
  - Fonctionne indépendamment du système de notifications

**Liens Navigation Sidebar Médecin**:
1. Dashboard (Home)
2. Patients (Users)
3. Notifications (Bell)
4. Paiements (DollarSign)

---

### 5. Espace Secrétaire

#### 5.1 Dashboard Secrétaire (/dashboard/secretaire)

**Composant**: `SecretaireDashboardComponent`

**Statistiques**:
1. RDV du Jour
2. Patients en Attente
3. RDV à Confirmer
4. Factures en Attente

**Sections**:
1. **Rendez-vous du Jour**:
   - Liste avec statut, patient, heure
2. **File d'Attente**:
   - Patients actuellement en salle d'attente
   - Indication "En consultation" pour patient actuel
3. **Consultations à Facturer**:
   - Notifications de facturation non traitées
   - Bouton rapide "Générer facture"

#### 5.2 File d'Attente et RDV (/dashboard/secretaire/queue)

**Composant**: `SecretaireQueueComponent`

**Layout 2 Colonnes**:

**Colonne Gauche: Rendez-vous du Jour**
- Liste des RDV avec:
  - Heure, Patient, Motif
  - Badge urgence
  - Badge statut (Confirmé/En attente/Annulé)
- Boutons actions:
  - "Marquer absent" → Déplace vers section Absents
  - "Ajouter à la file" (si patient en retard)
- Section "Absents" en bas (collapsible)

**Colonne Droite: File d'Attente**
- Header avec:
  - Titre "File d'Attente"
  - Bouton "Envoyer au Médecin" (en haut, responsive)
    - Prend le premier patient de la file
    - Crée notification pour médecin
    - Marque patient comme "En consultation"
    - Toast de confirmation
- Liste des patients en attente:
  - Ordre réorganisable par drag-and-drop
  - Affichage: Nom, Heure d'arrivée, Urgence
  - Premier patient a badge "Prochain"
  - Patient en consultation a badge "En consultation"

**Drag and Drop**:
- Librairie: `@angular/cdk/drag-drop`
- Permet réorganisation de la file d'attente
- Animation smooth lors du déplacement

#### 5.3 Gestion des Patients (/dashboard/secretaire/patients)

**Composant**: `SecretairePatientsComponent`

**Vue**:
- Statistiques patients
- Barre de recherche
- Bouton "Nouveau Patient"
- Tableau responsive:
  - Avatar, Nom, Date naissance, Genre
  - Contact (téléphone, email)
  - Date création
  - Actions: Voir, Éditer, Supprimer

**Formulaire CRUD Patient**:
- Validation complète:
  - Prénom, Nom (requis)
  - Date de naissance (date picker)
  - Genre (radio buttons)
  - Téléphone (format: +XXX...)
  - Email (format validé)
  - Adresse
  - Groupe sanguin (select optionnel)
  - Allergies (textarea, multi)
  - Maladies chroniques (textarea, multi)
  - Contact d'urgence: Nom, Téléphone, Relation
- Messages d'erreur inline
- Toast confirmation

#### 5.4 Notifications Facturation (/dashboard/secretaire/notifications)

**Composant**: `SecretaireNotificationsComponent`

**Vue**:
- Tabs: "À traiter" et "Historique"
- Cards notifications:
  - Patient (nom, âge)
  - Médecin
  - Date consultation
  - Diagnostic
  - Traitement
  - Notes consultation
  - Formulaire génération facture:
    - Montant (input number, requis)
    - Mode paiement (select: Espèces, CB, Chèque, Virement)
    - Bouton "Générer la facture"
      - Validation du formulaire
      - Création facture
      - Marque notification comme traitée
      - Ouvre dialog d'impression facture

**Dialog Impression Facture**:
- Format professionnel A4:
  - En-tête: Logo Cabinet, Nom, Adresse
  - Numéro facture (auto-généré)
  - Date
  - Informations patient
  - Détails consultation
  - Tableau: Acte | Montant
  - Total TTC
  - Mode de paiement
  - Pied de page avec mentions légales
- Bouton "Imprimer" → `window.print()`
- Styles CSS pour impression (`@media print`)

#### 5.5 Gestion Rendez-vous (/dashboard/secretaire/rendez-vous)

**Composant**: `SecretaireRendezVousComponent`

**Vue Principale**:
- **Calendrier Mensuel** (Haut de page):
  - Affichage mois en cours
  - Navigation mois précédent/suivant
  - Indicateurs visuels:
    - Points colorés sur dates avec RDV
    - Nombre de RDV par jour
  - Clic sur date → Affiche créneaux du jour
  - Design futuriste avec bordures néon

- **Vue Créneaux Horaires** (Bas de page):
  - Titre: "Rendez-vous du [Date sélectionnée]"
  - Grille horaire:
    - Lignes: Créneaux de 30 min de 8h à 18h
    - Colonnes: Heure | Créneau (rectangle)
  - Créneaux libres:
    - Rectangle gris avec bordure pointillée
    - Texte "Disponible"
    - Clic → Ouvre dialog création RDV
  - Créneaux réservés:
    - Rectangle coloré selon statut:
      - Vert: Confirmé
      - Orange: En attente
      - Rouge: Urgent
      - Gris: Annulé
    - Affiche: Patient, Motif (tronqué)
    - Clic → Ouvre dialog détails RDV

**Dialog Création RDV**:
- Pré-rempli: Date et heure du créneau cliqué
- Formulaire:
  - Patient (select avec recherche)
  - Motif (textarea, requis)
  - Urgence (radio: Normal, Urgent, Urgence)
  - Notes (textarea, optionnel)
- Validation complète
- Bouton "Créer le rendez-vous"

**Dialog Détails RDV**:
- Affichage complet des infos RDV
- Boutons actions:
  - "Modifier" → Ouvre formulaire édition
  - "Annuler RDV" → Change statut à annulé
  - "Confirmer" → Change statut à confirmé
  - "Supprimer" → Suppression définitive
- Mise à jour en temps réel de la grille

**Responsive**:
- Desktop: Calendrier + Grille côte à côte si possible
- Mobile: Stack vertical

**Liens Navigation Sidebar Secrétaire**:
1. Dashboard (Home)
2. File d'Attente (Clock)
3. Patients (Users)
4. Rendez-vous (Calendar)
5. Notifications (Bell)

---

## Système de Notifications Détaillé

### Pour le Médecin

**Service**: `NotificationsService.patientNotifications$`

**Création**:
- Quand secrétaire clique "Envoyer au Médecin" dans file d'attente
- Contenu notification:
  ```typescript
  {
    id: generateId(),
    patientId: patient.id,
    appointmentId: appointment.id,
    message: `${patient.name} est prêt pour consultation`,
    urgency: appointment.urgency,
    isRead: false,
    createdAt: new Date()
  }
  ```

**Affichage**:
- Badge rouge dans navbar avec compteur
- Page `/dashboard/medecin/notifications`
- Clic "Voir dossier" → marque comme lue + redirige

### Pour la Secrétaire

**Service**: `NotificationsService.billingNotifications$`

**Création**:
- Quand médecin clique "Terminer la consultation"
- Contenu notification:
  ```typescript
  {
    id: generateId(),
    consultationId: consultation.id,
    patientId: patient.id,
    medecinId: medecin.id,
    isProcessed: false,
    invoiceGenerated: false,
    createdAt: new Date()
  }
  ```

**Affichage**:
- Badge rouge dans navbar avec compteur
- Page `/dashboard/secretaire/notifications`
- Génération facture → marque comme traitée

---

## Guards et Protection des Routes

### AuthGuard
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.isLoading$.pipe(
      filter(isLoading => !isLoading), // Attend fin du chargement
      take(1),
      switchMap(() => this.authService.currentUser$),
      map(user => {
        if (!user) {
          this.router.navigate(['/']);
          return false;
        }
        
        // Vérifier le rôle selon la route
        const requiredRole = route.data['role'];
        if (requiredRole && user.role !== requiredRole) {
          this.router.navigate([`/dashboard/${user.role}`]);
          return false;
        }
        
        return true;
      })
    );
  }
}
```

### Configuration Routes
```typescript
export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'dashboard/admin',
    canActivate: [AuthGuard],
    data: { role: 'admin' },
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      // ... autres routes admin
    ]
  },
  // ... autres rôles
];
```

---

## Composants Réutilisables à Créer

### 1. FloatingMedicalElementsComponent
- Affiche éléments médicaux animés en arrière-plan
- Props: nombre d'éléments
- Animations CSS avec @keyframes

### 2. StatCardComponent
- Card statistique réutilisable
- Props: titre, valeur, icône, couleur, tendance
- Effet glassmorphism et glow

### 3. ThemeToggleComponent
- Bouton toggle soleil/lune
- Utilise service de thème
- Animations de rotation

### 4. NotificationBadgeComponent
- Badge rouge avec compteur
- Props: count$
- Animation pulse si count > 0

### 5. PatientAvatarComponent
- Avatar avec initiales colorées
- Props: nom du patient
- Génère couleur basée sur nom

### 6. StatusBadgeComponent
- Badge coloré selon statut
- Props: status, type
- Mapping couleurs prédéfini

### 7. AppointmentCardComponent
- Card rendez-vous réutilisable
- Props: appointment
- Affichage conditionnel selon statut

---

## Mock Data Initial

### Utilisateurs
```typescript
const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'admin@cabinetx.com',
    password: 'admin123',
    name: 'Admin Principal',
    role: 'admin',
    phone: '+33612345678',
    createdAt: new Date('2024-01-01')
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
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'u3',
    email: 'secretaire@cabinetx.com',
    password: 'secretaire123',
    name: 'Sophie Laurent',
    role: 'secretaire',
    phone: '+33634567890',
    cabinetId: 'c1',
    createdAt: new Date('2024-01-15')
  }
];
```

### Cabinets
```typescript
const mockCabinets: Cabinet[] = [
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
    createdAt: new Date('2024-01-01')
  },
  // Ajouter 4-5 autres cabinets avec positions différentes
];
```

### Patients (10-15 patients)
### Médicaments (20-30 médicaments variés)
### Rendez-vous (15-20 RDV sur plusieurs jours)
### Consultations (5-10 consultations)

---

## Checklist de Migration Complète

### Phase 1: Setup Projet
- [ ] Créer projet Angular 17+ avec routing
- [ ] Installer Tailwind CSS v4
- [ ] Configurer TypeScript strict mode
- [ ] Setup structure de dossiers
- [ ] Installer dépendances: Angular Material/PrimeNG, RxJS, date-fns

### Phase 2: Design System
- [ ] Configurer tokens Tailwind dans styles.css
- [ ] Créer composants UI de base
- [ ] Implémenter système de thème (dark/light)
- [ ] Créer animations CSS réutilisables

### Phase 3: Core Services
- [ ] AuthService avec localStorage
- [ ] NotificationsService avec BehaviorSubjects
- [ ] MockDataService avec données initiales
- [ ] ThemeService pour dark mode
- [ ] AuthGuard pour protection routes

### Phase 4: Authentification
- [ ] Page Login avec animations
- [ ] Composant FloatingMedicalElements
- [ ] Logique de login et redirection
- [ ] Gestion des erreurs

### Phase 5: Layout Principal
- [ ] DashboardLayoutComponent
- [ ] Navbar responsive
- [ ] Sidebar avec navigation dynamique
- [ ] Intégration notifications badge
- [ ] Profile dropdown

### Phase 6: Espace Admin
- [ ] Dashboard avec statistiques
- [ ] Page Users avec CRUD
- [ ] Page Medications avec CRUD
- [ ] Page Cabinets avec vue carte
- [ ] Formulaires avec validation

### Phase 7: Espace Médecin
- [ ] Dashboard médecin
- [ ] Liste patients
- [ ] Détails patient avec tabs
- [ ] Gestion consultations
- [ ] Création ordonnances
- [ ] Page notifications
- [ ] Page paiements
- [ ] Bouton "Patient suivant"

### Phase 8: Espace Secrétaire
- [ ] Dashboard secrétaire
- [ ] Page file d'attente avec drag-drop
- [ ] Page patients avec CRUD
- [ ] Page notifications facturation
- [ ] Dialog impression facture
- [ ] Page calendrier rendez-vous
- [ ] Grille créneaux horaires

### Phase 9: Intégrations
- [ ] Système notifications temps réel
- [ ] Liaison cabinets-utilisateurs
- [ ] Génération PDF factures/ordonnances
- [ ] Intégration Stripe (simulée en mock)

### Phase 10: Polish
- [ ] Tests responsiveness toutes pages
- [ ] Vérifier toutes animations
- [ ] Optimiser performances
- [ ] Documenter code
- [ ] Tests utilisateurs

---

## Notes Importantes pour l'IA Agent

1. **Respect du Design**: Le design DOIT être futuriste avec thème vert néon médical. Utiliser systématiquement les effets glassmorphism, glow, et animations.

2. **Cohérence UI**: Tous les formulaires doivent avoir la même structure de validation avec messages d'erreur inline.

3. **Responsive**: Chaque page doit être testée sur mobile, tablet, desktop avec breakpoints appropriés.

4. **Animations**: Ne pas oublier les micro-interactions (hover, click, transitions) sur tous les éléments interactifs.

5. **Services**: Utiliser RxJS et BehaviorSubjects pour gestion d'état réactive.

6. **Types**: Tout doit être typé avec TypeScript strict.

7. **Modularité**: Créer des composants réutilisables maximum.

8. **Performance**: Utiliser OnPush change detection, lazy loading des modules.

9. **Accessibilité**: Labels sur tous inputs, ARIA attributes, contraste couleurs WCAG AA.

10. **Mock Data**: Commencer avec mock data complet pour tester toutes fonctionnalités.

---

## Résumé Exécutif pour l'Agent IA

**Objectif**: Recréer CabinetX en Angular avec exactement le même design futuriste vert néon et toutes les fonctionnalités.

**Approche**:
1. Setup architecture Angular avec services RxJS
2. Implémenter design system Tailwind CSS v4
3. Créer pages selon rôles (Admin, Médecin, Secrétaire)
4. Intégrer système notifications bidirectionnel
5. Ajouter CRUD complet pour toutes entités
6. Polir avec animations et responsive

**Durée estimée**: 40-60h de développement

**Priorité**: Design et UX doivent être identiques au projet Next.js original.
