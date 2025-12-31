import apiClient from './client'

// Shapes alignées sur le backend ConsultationService
// DTO complet (non utilisé pour l'historique simplifié)
export interface ConsultationDTO {
  id: number
  rendezVousId: number
  patientId: number
  medecinId: number
  cabinetId: number
  type: string
  dateConsultation: string // OffsetDateTime as ISO string
  examenClinique?: string
  examenSupplementaire?: string
  diagnostic?: string
  traitement?: string
  observations?: string
}

// Résumé retourné par /patients/{id}/historique
export interface ConsultationSummaryDTO {
  id: number
  dateConsultation: string
  type: string
  diagnostic: string
  traitement?: string
  observations?: string
}

export const consultationApi = {
  getByPatient: (patientId: number) =>
    apiClient.get<ConsultationSummaryDTO[]>(`/api/consultations/patients/${patientId}/historique`),
}
