import apiClient from './client'

export type BillingSubscriptionStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID'

export type BillingInvoiceStatus = 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'INITIATED'

export interface BillingPlanDTO {
  planId?: string
  priceId: string
  name: string
  amount: number
  currency: string
  interval: string
  description?: string
}

export interface BillingSubscriptionDTO {
  cabinetId: number
  stripeSubscriptionId?: string
  priceId?: string
  planName?: string
  status: BillingSubscriptionStatus
  autoRenew: boolean
  currentPeriodStart?: string
  currentPeriodEnd?: string
}

export interface BillingInvoiceDTO {
  id?: string | number
  subscriptionId?: string | number
  cabinetId?: number
  amount: number
  currency: string
  status: BillingInvoiceStatus
  invoiceUrl?: string
  stripeInvoiceId?: string
  periodStart?: string
  periodEnd?: string
  createdAt?: string
  paidAt?: string
}

export interface CheckoutSessionRequest {
  planId?: string
  priceId?: string
  cabinetId: number
  customerEmail?: string
  customerName?: string
  successUrl?: string
  cancelUrl?: string
}

export interface CheckoutSessionResponse {
  sessionId?: string
  url?: string | null
}

export interface CreateCustomerRequest {
  cabinetId: number
  customerEmail?: string
  customerName?: string
}

export interface CancelSubscriptionRequest {
  cabinetId: number
  cancelAtPeriodEnd?: boolean
}

// Consultation Invoice types (different from subscription billing)
export type ConsultationInvoiceStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
export type ConsultationPaymentMethod = 'CASH' | 'CREDIT_CARD' | 'INSURANCE' | 'CHECK'

export interface ConsultationInvoiceDTO {
  id: number
  invoiceNumber: string
  patientId: number
  consultationId: number
  invoiceDate: string // LocalDateTime ISO string
  amount: number
  status: ConsultationInvoiceStatus
  paymentMethod?: ConsultationPaymentMethod
  paymentDate?: string // LocalDateTime ISO string
  patientName: string
}

export interface GenerateInvoiceRequest {
  consultationId: number
  amount: number
}

export interface RecordPaymentRequest {
  paymentMethod: ConsultationPaymentMethod
}

export const billingApi = {
  // NOTE: backend billing endpoints are served under /api/payment/billing
  getPlans: () => apiClient.get<BillingPlanDTO[]>(`/api/payment/billing/plans`),
  getSubscription: (cabinetId: number) =>
    apiClient
      .get<BillingSubscriptionDTO>(`/api/payment/billing/subscription`, { params: { cabinetId } })
      .catch((error) => {
        // Le backend renvoie un 404 text/plain "No subscription found..." quand aucune souscription n'existe.
        if (error?.response?.status === 404) {
          return { data: null as BillingSubscriptionDTO | null }
        }
        throw error
      }),
  getInvoices: (cabinetId: number) =>
    apiClient
      .get<BillingInvoiceDTO[]>(`/api/payment/billing/invoices`, { params: { cabinetId } })
      .catch((error) => {
        // 404 text/plain "No Stripe customer..." => on renvoie une liste vide pour ne pas casser l'UI.
        if (error?.response?.status === 404) {
          return { data: [] as BillingInvoiceDTO[] }
        }
        throw error
      }),
  createCheckoutSession: (payload: CheckoutSessionRequest) =>
    apiClient.post<CheckoutSessionResponse>(`/api/payment/billing/checkout-session`, payload),
  createOrGetCustomer: (payload: CreateCustomerRequest) => apiClient.post(`/api/payment/billing/customer`, payload),
  getCustomer: (cabinetId: number) => apiClient.get(`/api/payment/billing/customer`, { params: { cabinetId } }),
  cancelSubscription: (payload: CancelSubscriptionRequest) =>
    apiClient.post(`/api/payment/billing/subscription/cancel`, payload),

  // Consultation Invoice APIs
  generateInvoice: (consultationId: number, amount: number) =>
    apiClient.post<ConsultationInvoiceDTO>(`/api/billing/invoices`, null, {
      params: { consultationId, amount }
    }),
  getInvoiceByConsultation: (consultationId: number) =>
    apiClient.get<ConsultationInvoiceDTO>(`/api/billing/consultations/${consultationId}/invoice`),
  updateInvoiceAmount: (invoiceId: number, amount: number) =>
    apiClient.put<ConsultationInvoiceDTO>(`/api/billing/invoices/${invoiceId}/amount`, null, {
      params: { amount }
    }),
  recordPayment: (invoiceId: number, paymentMethod: ConsultationPaymentMethod) =>
    apiClient.put<ConsultationInvoiceDTO>(`/api/billing/invoices/${invoiceId}/payment`, null, {
      params: { paymentMethod }
    }),
  getInvoiceById: (invoiceId: number) =>
    apiClient.get<ConsultationInvoiceDTO>(`/api/billing/invoices/${invoiceId}`),
  getInvoicesByPatient: (patientId: number) =>
    apiClient.get<ConsultationInvoiceDTO[]>(`/api/billing/patients/${patientId}/invoices`),
  getInvoicePdf: (invoiceId: number) =>
    apiClient.get<Blob>(`/api/billing/invoices/${invoiceId}/pdf`, {
      responseType: 'blob' as any
    }),
}
