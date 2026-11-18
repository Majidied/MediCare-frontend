import apiClient from './client'

export type PrescriptionLineType = "MEDICATION" | "OTHER" | string

export interface PrescriptionLineDTO {
  id?: number
  prescriptionId?: number
  lineType?: PrescriptionLineType
  medicationId: number
  medicationName?: string
  dosage: string
  durationDays: number
  comment?: string
}

export interface PrescriptionDTO {
  id: number
  consultationId: number
  patientId: number
  doctorId: number
  clinicId: number
  prescriptionDate: string
  digitalSignature?: string
  lines: PrescriptionLineDTO[]
}

export interface CreatePrescriptionDTO {
  consultationId: number
  patientId: number
  doctorId: number
  clinicId: number
  prescriptionDate: string
  digitalSignature?: string
  lines: Array<Pick<PrescriptionLineDTO, "medicationId" | "dosage" | "durationDays" | "comment" | "lineType" | "medicationName">>
}

export const prescriptionApi = {
  getThisWeekByClinic: (clinicId: number) =>
    apiClient.get<PrescriptionDTO[]>(`/api/prescriptions/clinic/${clinicId}/this-week`),
  getByPatient: (patientId: number) => apiClient.get<PrescriptionDTO[]>(`/api/prescriptions/patient/${patientId}`),
  getByConsultation: (consultationId: number) =>
    apiClient.get<PrescriptionDTO>(`/api/prescriptions/consultation/${consultationId}`),
  getById: (id: number) => apiClient.get<PrescriptionDTO>(`/api/prescriptions/${id}`),
  create: (dto: CreatePrescriptionDTO) => apiClient.post<PrescriptionDTO>(`/api/prescriptions`, dto),
  addLine: (prescriptionId: number, line: PrescriptionLineDTO) =>
    apiClient.post<PrescriptionDTO>(`/api/prescriptions/${prescriptionId}/lines`, line),
}
