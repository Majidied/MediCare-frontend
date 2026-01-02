"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar, Users, Clock, FileText, Activity } from "lucide-react"
import { useAppointmentsByDate } from "@/hooks/use-appointment"
import { useMemo } from "react"

const CABINET_ID = 1 // In real app, get from auth context

export default function SecretaireDashboard() {
  const { user } = useAuth()

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }, [])

  // Fetch today's appointments
  const { data: todayAppointments = [], isLoading } = useAppointmentsByDate(today, CABINET_ID)

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

  // Get first 5 appointments for the list
  const upcomingAppointments = useMemo(() => {
    return todayAppointments.slice(0, 5)
  }, [todayAppointments])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonjour, {user?.name}</h1>
          <p className="text-muted-foreground">Bienvenue sur votre espace secrétaire</p>
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
              <h2 className="text-xl font-semibold">Rendez-vous du jour</h2>
              <Activity className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Chargement...</p>
              ) : upcomingAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun rendez-vous aujourd'hui</p>
              ) : (
                upcomingAppointments.map((rdv) => (
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
              ) : todayAppointments.slice(5, 9).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun autre rendez-vous</p>
              ) : (
                todayAppointments.slice(5, 9).map((apt, idx) => (
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
