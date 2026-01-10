"use client"

import { useAuth } from "@/lib/auth-context"
import { useCurrentUser } from "@/hooks/use-user"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar, Users, Clock, FileText, Activity, Building2 } from "lucide-react"
import { useAppointmentsByDate } from "@/hooks/use-appointment"
import { getTodayLocalDateString } from "@/lib/date.utils"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { clinicApi } from "@/api/clinic.api"

export default function SecretaireDashboard() {
  const { user } = useAuth()

  // Fetch user details directly using React Query
  const { data: userDetails } = useCurrentUser(user?.email)
  const cabinetId = userDetails?.clinicId ?? 0

  const { data: clinicData } = useQuery({
    queryKey: ["clinic", cabinetId],
    queryFn: async () => {
      const { data } = await clinicApi.getById(cabinetId)
      return data
    },
    enabled: cabinetId > 0,
    staleTime: 5 * 60 * 1000,
  })

  // Debug logging
  console.log("[SecretaireDashboard] User from auth:", user)
  console.log("[SecretaireDashboard] User details from API:", userDetails)
  console.log("[SecretaireDashboard] Cabinet ID:", cabinetId)

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    return getTodayLocalDateString()
  }, [])

  // Fetch today's appointments (raw backend response)
  const { data: todayAppointmentsRaw = [], isLoading } = useAppointmentsByDate(today, cabinetId)

  // Convert backend response to frontend-friendly format
  const todayAppointments = useMemo(() => {
    // Import the helper inline to avoid circular import issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { appointmentHelpers } = require("@/api/appointment.api")
    return todayAppointmentsRaw.map((apt: any) => appointmentHelpers.toFrontend(apt))
  }, [todayAppointmentsRaw])

  // Calculate stats
  const stats = useMemo(() => {
    const total = todayAppointments.length
    const confirmed = todayAppointments.filter(apt => apt.status === 'confirmé').length
    const waiting = todayAppointments.filter(apt => apt.status === 'en_attente').length

    return {
      total,
      confirmed,
      waiting,
    }
  }, [todayAppointments])

  // Split appointments into current/past and upcoming based on current time
  const { currentAppointments, upcomingAppointments } = useMemo(() => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    // Sort appointments by time
    const sortedAppointments = [...todayAppointments].sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number)
      const [bHour, bMin] = b.time.split(':').map(Number)
      return (aHour * 60 + aMin) - (bHour * 60 + bMin)
    })

    const current: typeof todayAppointments = []
    const upcoming: typeof todayAppointments = []

    sortedAppointments.forEach(apt => {
      const [hour, minute] = apt.time.split(':').map(Number)
      const aptTimeInMinutes = hour * 60 + minute

      // Consider appointments within 30 minutes of current time as current
      if (aptTimeInMinutes <= currentTimeInMinutes + 30) {
        current.push(apt)
      } else {
        upcoming.push(apt)
      }
    })

    return {
      currentAppointments: current.slice(0, 5), // First 5 current/past appointments
      upcomingAppointments: upcoming.slice(0, 4), // Next 4 upcoming appointments
    }
  }, [todayAppointments])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonjour, {user?.name}</h1>
          <p className="text-muted-foreground">Bienvenue sur votre espace secrétaire</p>
          <div className="inline-flex items-center gap-2 mt-2 rounded-full px-3 py-1 bg-gradient-to-r from-primary/80 to-accent/80 text-white shadow-lg shadow-primary/30">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">{clinicData?.name || userDetails?.clinicName || userDetails?.clinic?.name || "Votre cabinet"}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-6 rounded-xl glow-primary space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">RDV Aujourd'hui</p>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold">{isLoading ? '...' : stats.total}</p>
            <p className="text-xs text-muted-foreground">Total rendez-vous</p>
          </div>

          <div className="glass-card p-6 rounded-xl glow-accent space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">RDV Confirmés</p>
              <Users className="h-4 w-4 text-accent" />
            </div>
            <p className="text-3xl font-bold">{isLoading ? '...' : stats.confirmed}</p>
            <p className="text-xs text-muted-foreground">Prêts pour consultation</p>
          </div>

          <div className="glass-card p-6 rounded-xl glow-success space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">En attente</p>
              <Clock className="h-4 w-4 text-success" />
            </div>
            <p className="text-3xl font-bold">{isLoading ? '...' : stats.waiting}</p>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </div>

          <div className="glass-card p-6 rounded-xl glow-info space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Disponibilité</p>
              <FileText className="h-4 w-4 text-info" />
            </div>
            <p className="text-3xl font-bold">{isLoading ? '...' : Math.max(0, 20 - stats.total)}</p>
            <p className="text-xs text-muted-foreground">Créneaux libres</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Rendez-vous en cours</h2>
              <Activity className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Chargement...</p>
              ) : currentAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun rendez-vous en cours</p>
              ) : (
                currentAppointments.map((rdv) => (
                  <div
                    key={rdv.id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-xs font-medium text-primary">{rdv.time}</span>
                      </div>
                      <div>
                        <p className="font-medium">{rdv.patientName}</p>
                        <p className="text-xs text-muted-foreground">{rdv.motif}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${rdv.status === "confirmé"
                        ? "bg-success/10 text-success border border-success/20"
                        : rdv.status === "en_attente"
                          ? "bg-warning/10 text-warning border border-warning/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                    >
                      {rdv.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold">Prochains rendez-vous</h2>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Chargement...</p>
              ) : upcomingAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun rendez-vous à venir</p>
              ) : (
                upcomingAppointments.map((apt, idx) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/30">
                        <span className="text-sm font-bold text-primary">{apt.time}</span>
                      </div>
                      <div>
                        <p className="font-medium">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground">{apt.motif}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
