import apiClient from './client'

export type StatutRDV = 'CONFIRME' | 'EN_CONSULTATION' | 'ANNULE' | 'TERMINE' | 'MISSING'

export interface RDVResponse {
  id: number
  patientId: number
  cabinetId: number
  date: string
  Heure_debut: string
  Heure_fin: string
  motifRDV: string
  notes?: string
  prenom?: string
  nom?: string
  cin?: string
  dateNaissance?: string
  statutRDV: StatutRDV
}

export const rdvApi = {
  getTodayForPatient: async (patientId: number) => {
    try {
      // Hitting the appointments service via the API gateway prefix
      const { data } = await apiClient.get<RDVResponse>(`/api/appointments/patients/${patientId}/today`)
      console.log('      RDV today data:', data)
      return data
    } catch (error: any) {
      // Gracefully allow 404 meaning no RDV for today
      if (error?.response?.status === 404) {
        return null
      }
      throw error
    }
  },
  getByDate: async (date: string, cabinetId: number) => {
    try {
      const { data } = await apiClient.get<RDVResponse[]>(`/api/appointments/by-date`, {
        params: { date, cabinetId },
      })
      return data
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return []
      }
      throw error
    }
  },
}
