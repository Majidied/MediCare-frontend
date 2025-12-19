"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface PatientNotification {
  id: string
  patientId: string
  patientName: string
  patientAge: number
  appointmentTime: string
  appointmentDate: string
  reason: string
  urgency: "normal" | "urgent" | "emergency"
  status: "pending" | "read"
  sentBy: string
  sentAt: string
  patientHistory?: string
  lastVisit?: string
}

interface BillingNotification {
  id: string
  type: "billing"
  consultationId: string
  patientId: string
  patientName: string
  patientAge: number
  consultationDate: string
  motif: string
  diagnostic: string
  traitement: string
  notes?: string
  actes?: string[]
  status: "pending" | "processed"
  sentBy: string
  sentAt: string
}

interface NotificationsContextType {
  notifications: PatientNotification[]
  billingNotifications: BillingNotification[]
  unreadCount: number
  unreadBillingCount: number
  markAsRead: (id: string) => void
  addNotification: (notification: PatientNotification) => void
  addBillingNotification: (notification: BillingNotification) => void
  markBillingAsProcessed: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<PatientNotification[]>([
    {
      id: "1",
      patientId: "p1",
      patientName: "Marie Dubois",
      patientAge: 45,
      appointmentTime: "10:30",
      appointmentDate: "Aujourd'hui",
      reason: "Contrôle de routine",
      urgency: "normal",
      status: "pending",
      sentBy: "Sophie Laurent",
      sentAt: "Il y a 5 min",
      lastVisit: "12 Mars 2024",
      patientHistory: "Diabète type 2, suivi régulier",
    },
    {
      id: "2",
      patientId: "p2",
      patientName: "Jean Martin",
      patientAge: 32,
      appointmentTime: "11:00",
      appointmentDate: "Aujourd'hui",
      reason: "Douleurs abdominales aigües",
      urgency: "urgent",
      status: "pending",
      sentBy: "Marie Dubois",
      sentAt: "Il y a 2 min",
      lastVisit: "5 Janvier 2024",
      patientHistory: "Aucun antécédent majeur",
    },
    {
      id: "3",
      patientId: "p3",
      patientName: "Sophie Laurent",
      patientAge: 28,
      appointmentTime: "14:00",
      appointmentDate: "Aujourd'hui",
      reason: "Renouvellement ordonnance",
      urgency: "normal",
      status: "pending",
      sentBy: "Sophie Laurent",
      sentAt: "Il y a 15 min",
      lastVisit: "28 Février 2024",
      patientHistory: "Asthme léger, traitement Ventoline",
    },
  ])

  const [billingNotifications, setBillingNotifications] = useState<BillingNotification[]>([
    {
      id: "b1",
      type: "billing",
      consultationId: "c1",
      patientId: "p1",
      patientName: "Ahmed Benali",
      patientAge: 39,
      consultationDate: "15 Janvier 2025",
      motif: "Consultation de suivi",
      diagnostic: "Hypertension artérielle stable",
      traitement: "Continuation du traitement en cours",
      notes: "Patient bien contrôlé, bon observance thérapeutique",
      actes: ["Consultation", "Mesure tension", "ECG"],
      status: "pending",
      sentBy: "Dr. Sarah Martin",
      sentAt: "Il y a 10 min",
    },
    {
      id: "b2",
      type: "billing",
      consultationId: "c2",
      patientId: "p2",
      patientName: "Fatima Zahra",
      patientAge: 34,
      consultationDate: "15 Janvier 2025",
      motif: "Douleurs lombaires",
      diagnostic: "Lombalgie commune",
      traitement: "Anti-inflammatoires + repos",
      notes: "Recommandation de kinésithérapie si persistance",
      actes: ["Consultation", "Examen clinique"],
      status: "pending",
      sentBy: "Dr. Sarah Martin",
      sentAt: "Il y a 25 min",
    },
  ])

  const unreadCount = notifications.filter((n) => n.status === "pending").length
  const unreadBillingCount = billingNotifications.filter((n) => n.status === "pending").length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, status: "read" } : notif)))
  }

  const addNotification = (notification: PatientNotification) => {
    setNotifications((prev) => [notification, ...prev])
  }

  const addBillingNotification = (notification: BillingNotification) => {
    setBillingNotifications((prev) => [notification, ...prev])
  }

  const markBillingAsProcessed = (id: string) => {
    setBillingNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, status: "processed" } : notif)),
    )
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        billingNotifications,
        unreadCount,
        unreadBillingCount,
        markAsRead,
        addNotification,
        addBillingNotification,
        markBillingAsProcessed,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider")
  }
  return context
}

export type { PatientNotification, BillingNotification }
