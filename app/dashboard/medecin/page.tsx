"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { rdvApi, type RDVResponse, type StatutRDV } from "@/api/rdv.api"
import { consultationApi, type ConsultationSummaryDTO, type MedecinWeeklyStatsDTO } from "@/api/consultation.api"
import { patientApi } from "@/api/patient.api"
import { prescriptionApi } from "@/api/prescription.api"
import { useAuth } from "@/lib/auth-context"
import { useCurrentUser } from "@/hooks/use-user"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, CheckCircle, Clock, Loader2, Search, Stethoscope, Users, Calendar, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"

export default function MedecinDashboard() {
  const router = useRouter()
  const { refreshNotifications } = useNotifications()
  const today = new Date().toISOString().split("T")[0]
  const { user } = useAuth()

  // Fetch user details directly using React Query
  const { data: userDetails, isLoading: userDetailsLoading } = useCurrentUser(user?.email)
  const cabinetId = userDetails?.clinicId

  // Debug logging
  console.log("[MedecinDashboard] User from auth:", user)
  console.log("[MedecinDashboard] User details from API:", userDetails)
  console.log("[MedecinDashboard] Cabinet ID:", cabinetId)

  // Use the numeric database ID from userDetails, not the Keycloak UUID
  const medecinId = userDetails?.id ?? 0
  const recentLimit = 5

  // Note: WebSocket connection is now handled globally in NotificationsContext

  const {
    data: todayAppointments = [],
    isLoading: todayAppointmentsLoading,
    isError: todayAppointmentsError,
    error: todayAppointmentsErrorObj,
  } = useQuery({
    queryKey: ["rdv", "by-date", cabinetId, today],
    queryFn: () => rdvApi.getByDate(today, cabinetId ?? 0),
    enabled: !!cabinetId,
    staleTime: 60 * 1000,
  })

  const totalAppointments = todayAppointments.length
  const enConsultationCount = todayAppointments.filter((rdv) => rdv.statutRDV === "EN_CONSULTATION").length
  const confirmedCount = todayAppointments.filter((rdv) => rdv.statutRDV === "CONFIRME").length

  const {
    data: recentConsultations = [],
    isLoading: recentConsultationsLoading,
    isError: recentConsultationsError,
    error: recentConsultationsErrorObj,
  } = useQuery({
    queryKey: ["consultations", "recent", medecinId, recentLimit],
    queryFn: async () => {
      const { data } = await consultationApi.getRecentByMedecin(medecinId, recentLimit)
      console.log("Recent consultations data:", data)
      return data
    },
    enabled: medecinId > 0,
    staleTime: 60 * 1000,
  })

  const {
    data: weeklyStats,
    isLoading: weeklyStatsLoading,
    isError: weeklyStatsError,
    error: weeklyStatsErrorObj,
  } = useQuery<MedecinWeeklyStatsDTO>({
    queryKey: ["consultations", "weekly-stats", medecinId, cabinetId],
    queryFn: async () => {
      const { data } = await consultationApi.getMedecinWeeklyStats(medecinId, { cabinetId })
      return data
    },
    enabled: medecinId > 0,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: patientsByCabinet = [],
    isLoading: patientsLoading,
    isError: patientsError,
  } = useQuery({
    queryKey: ["patients", "by-cabinet", cabinetId],
    queryFn: async () => {
      const { data } = await patientApi.getByCabinet(cabinetId ?? 0)
      return data
    },
    enabled: cabinetId !== undefined && cabinetId >= 0,
    staleTime: 2 * 60 * 1000,
  })

  const {
    data: weeklyPrescriptions = [],
    isLoading: prescriptionsLoading,
    isError: prescriptionsError,
  } = useQuery({
    queryKey: ["prescriptions", "this-week", cabinetId],
    queryFn: async () => {
      const { data } = await prescriptionApi.getThisWeekByClinic(cabinetId ?? 0)
      return data
    },
    enabled: cabinetId !== undefined && cabinetId >= 0,
    staleTime: 2 * 60 * 1000,
  })

  const todayStats = weeklyStats?.daily?.find((day) => day.date === today)
  const consultationsToday = todayStats?.consultations
  const presenceRateToday = todayStats?.presenceRate
  const patientsActiveCount = patientsByCabinet.length
  const weeklyPrescriptionsCount = weeklyPrescriptions.length

  const stats = [
    {
      title: "Consultations du jour",
      value: weeklyStatsLoading ? "—" : String(Math.max(0, consultationsToday ?? 0)),
      change: weeklyStatsLoading
        ? "Chargement..."
        : presenceRateToday !== undefined
          ? `${Math.round(Math.max(0, presenceRateToday))}% de présence`
          : "Pas de données du jour",
      icon: Stethoscope,
      trend: consultationsToday && consultationsToday > 0 ? "up" : "neutral",
    },
    {
      title: "Patients Actifs",
      value: patientsLoading ? "—" : patientsError ? "N/A" : String(patientsActiveCount),
      change: patientsLoading ? "Chargement..." : patientsError ? "Erreur lors du chargement" : "Dans le cabinet",
      icon: Users,
      trend: "up",
    },
    {
      title: "Rendez-vous du jour",
      value: todayAppointmentsLoading ? "—" : String(totalAppointments),
      change: todayAppointmentsLoading
        ? "Chargement..."
        : `${enConsultationCount} en consultation, ${confirmedCount} confirmés`,
      icon: Calendar,
      trend: "neutral",
    },
    {
      title: "Ordonnances",
      value: prescriptionsLoading ? "—" : prescriptionsError ? "N/A" : String(weeklyPrescriptionsCount),
      change: prescriptionsLoading ? "Chargement..." : "Cette semaine",
      icon: FileText,
      trend: "up",
    },
  ]
  const formatTime = (time?: string) => (time ? time.slice(0, 5) : "--:--")
  const formatDateTime = (iso?: string) => {
    if (!iso) return "Date inconnue"
    const d = new Date(iso)
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDayLabel = (iso?: string) => {
    if (!iso) return "--"
    return new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" })
  }

  const getBarWidth = (value: number, max: number) => {
    if (!Number.isFinite(value) || max <= 0) return "4%"
    const pct = (value / max) * 100
    return `${Math.min(100, Math.max(4, pct))}%`
  }

  const sortedAppointments: RDVResponse[] = todayAppointmentsLoading
    ? []
    : [...todayAppointments].sort((a, b) => (a.Heure_debut || "").localeCompare(b.Heure_debut || ""))

  const consultationsCountWeekly = weeklyStats?.consultationsCount ?? 0
  const ordonnancesCountWeekly = weeklyStats?.ordonnancesCount ?? 0
  const normalizedOrdonnancesCount = ordonnancesCountWeekly >= 0 ? ordonnancesCountWeekly : 0
  const presenceRateWeekly = weeklyStats?.presenceRate ?? 0
  const maxWeeklyCount = Math.max(consultationsCountWeekly, normalizedOrdonnancesCount, 1)

  const getStatusBadge = (status: StatutRDV) => {
    switch (status) {
      case "EN_CONSULTATION":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            En consultation
          </Badge>
        )
      case "CONFIRME":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmé
          </Badge>
        )
      case "TERMINE":
        return (
          <Badge className="bg-muted/10 text-muted-foreground border-muted/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terminé
          </Badge>
        )
      case "ANNULE":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Annulé
          </Badge>
        )
      case "MISSING":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Médecin</h1>
            <p className="text-muted-foreground">Bienvenue Dr. Martin - Vue d'ensemble de votre journée</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="glass-card p-6 hover:scale-105 transition-all duration-300 glow-primary animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Rendez-vous du Jour</h2>
              </div>
              <Button variant="outline" size="sm" className="border-primary/20 bg-transparent">
                <Search className="w-4 h-4 mr-2" />
                Voir tout
              </Button>
            </div>
            <div className="space-y-3">
              {todayAppointmentsError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {(todayAppointmentsErrorObj as any)?.message || "Impossible de charger les rendez-vous du jour"}
                  </span>
                </div>
              )}

              {todayAppointmentsLoading && !todayAppointmentsError && (
                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chargement des rendez-vous...</span>
                </div>
              )}

              {!todayAppointmentsLoading && !todayAppointmentsError && sortedAppointments.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                  Aucun rendez-vous prévu pour aujourd'hui.
                </div>
              )}

              {!todayAppointmentsLoading && !todayAppointmentsError &&
                sortedAppointments.map((apt) => {
                  const timeRange = `${formatTime(apt.Heure_debut)} - ${formatTime(apt.Heure_fin)}`
                  const fullName = [apt.prenom, apt.nom].filter(Boolean).join(" ").trim() || "Patient inconnu"

                  return (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                    >
                      <div className="flex flex-col items-center justify-center min-w-[80px] p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-xs text-muted-foreground">Heure</span>
                        <span className="text-sm font-bold">{timeRange}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{fullName}</p>
                        <p className="text-sm text-muted-foreground">{apt.motifRDV || "Motif non renseigné"}</p>
                      </div>
                      {getStatusBadge(apt.statutRDV)}
                    </div>
                  )
                })}
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Consultations Récentes</h2>
            </div>
            <div className="space-y-3">
              {recentConsultationsError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {(recentConsultationsErrorObj as any)?.message || "Impossible de charger les consultations récentes"}
                  </span>
                </div>
              )}

              {recentConsultationsLoading && !recentConsultationsError && (
                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chargement des consultations...</span>
                </div>
              )}

              {!recentConsultationsLoading && !recentConsultationsError && recentConsultations.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                  Aucune consultation récente trouvée.
                </div>
              )}

              {!recentConsultationsLoading && !recentConsultationsError &&
                recentConsultations.map((consultation: ConsultationSummaryDTO) => (
                  <div
                    key={consultation.id}
                    className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{consultation.type || "Consultation"}</p>
                      <Badge variant="outline" className="text-xs">
                        {formatDateTime(consultation.dateConsultation)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {consultation.diagnostic || consultation.observations || "Pas de diagnostic renseigné"}
                    </p>
                  </div>
                ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 border-primary/20 bg-transparent"
              onClick={() => router.push('/dashboard/medecin/patients')}
            >
              Voir l'historique complet
            </Button>
          </Card>
        </div>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Statistiques Hebdomadaires</h2>
            {weeklyStats && (
              <span className="text-sm text-muted-foreground">
                Semaine du
                {" "}
                {new Date(weeklyStats.start).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} au
                {" "}
                {new Date(weeklyStats.end).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
              </span>
            )}
          </div>

          {weeklyStatsError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>
                {(weeklyStatsErrorObj as any)?.message || "Impossible de charger les statistiques hebdomadaires"}
              </span>
            </div>
          )}

          {weeklyStatsLoading && !weeklyStatsError && (
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Chargement des statistiques...</span>
            </div>
          )}

          {!weeklyStatsLoading && !weeklyStatsError && weeklyStats && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Consultations effectuées</span>
                    <span className="text-sm font-semibold">{consultationsCountWeekly}</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full animate-progress"
                      style={{ width: getBarWidth(consultationsCountWeekly, maxWeeklyCount) }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Ordonnances créées</span>
                    <span className="text-sm font-semibold">
                      {ordonnancesCountWeekly >= 0 ? ordonnancesCountWeekly : "N/A"}
                    </span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full animate-progress animation-delay-200"
                      style={{ width: getBarWidth(Math.max(0, normalizedOrdonnancesCount), maxWeeklyCount) }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Taux de présence</span>
                    <span className="text-sm font-semibold">{Math.round(presenceRateWeekly)}%</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full animate-progress animation-delay-400"
                      style={{ width: `${Math.min(100, Math.max(0, presenceRateWeekly))}%` }}
                    />
                  </div>
                </div>
              </div>

              {weeklyStats.daily?.length > 0 && (
                <div className="mt-6 grid gap-2 md:grid-cols-3">
                  {weeklyStats.daily.map((day) => (
                    <div key={day.date} className="p-3 rounded-lg border border-border/50 bg-background/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{formatDayLabel(day.date)}</span>
                        <Badge variant="outline" className="text-xs">
                          {day.consultations} cons.
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ordonnances: {day.ordonnances >= 0 ? day.ordonnances : "N/A"} · Présence: {
                          Math.round(day.presenceRate)
                        }
                        %
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
