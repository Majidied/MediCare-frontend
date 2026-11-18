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
  archived?: boolean
  archivedAt?: string
}

// Résumé retourné par /patients/{id}/historique
export interface ConsultationSummaryDTO {
  id: number
  dateConsultation: string
  type: string
  diagnostic: string
  traitement?: string
  observations?: string
  archived?: boolean
  archivedAt?: string
}

export interface DailyStatDTO {
  date: string // LocalDate ISO (yyyy-MM-dd)
  consultations: number
  ordonnances: number
  presenceRate: number // 0-100
}

export interface MedecinWeeklyStatsDTO {
  medecinId: number
  cabinetId?: number
  start: string // OffsetDateTime ISO
  end: string // OffsetDateTime ISO
  consultationsCount: number
  ordonnancesCount: number
  presenceRate: number
  daily: DailyStatDTO[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const consultationApi = {
  getByPatient: (patientId: number) =>
    apiClient.get<ConsultationSummaryDTO[]>(`/api/consultations/patients/${patientId}/historique`),
  getRecentByMedecin: (medecinId: number, limit = 5) =>
    apiClient
      .get<ConsultationSummaryDTO[]>(`/api/consultations/medecins/${medecinId}/recent`, {
        params: { limit },
      })
      .then((res) => {
        console.log("[consultationApi.getRecentByMedecin] medecinId=", medecinId, "limit=", limit, "data=", res.data)
        return res
      }),
  getByMedecin: (
    medecinId: number,
    params?: {
      page?: number
      size?: number
      sort?: string
      patientId?: number
      archived?: boolean
      type?: string
    },
  ) => apiClient.get<PageResponse<ConsultationSummaryDTO>>(`/api/consultations/medecins/${medecinId}`, { params }),
  getMedecinWeeklyStats: (
    medecinId: number,
    params?: { cabinetId?: number; startDate?: string; endDate?: string },
  ) =>
    apiClient
      .get<MedecinWeeklyStatsDTO>(`/api/consultations/stats/medecin/${medecinId}/weekly`, { params })
      .then((res) => {
        console.log("[consultationApi.getMedecinWeeklyStats] medecinId=", medecinId, "params=", params, "data=", res.data)
        return res
      }),
  update: (consultationId: number, dto: Partial<ConsultationDTO>) =>
    apiClient.put<ConsultationDTO>(`/api/consultations/${consultationId}`, dto).then((res) => {
      console.log("[consultationApi.update] payload:", dto)
      console.log("[consultationApi.update] response:", res.data)
      return res
    }),
  create: (dto: Partial<ConsultationDTO>) => apiClient.post<ConsultationDTO>(`/api/consultations`, dto),
  delete: (consultationId: number) => apiClient.delete(`/api/consultations/${consultationId}`),
}
