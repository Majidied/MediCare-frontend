"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { rdvApi, type RDVResponse, type StatutRDV } from "@/api/rdv.api"
import { consultationApi, type ConsultationSummaryDTO, type MedecinWeeklyStatsDTO } from "@/api/consultation.api"
import { clinicApi } from "@/api/clinic.api"
import { patientApi } from "@/api/patient.api"
import { prescriptionApi } from "@/api/prescription.api"
import { useAuth } from "@/lib/auth-context"
import { useCurrentUser } from "@/hooks/use-user"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, CheckCircle, Clock, Loader2, Search, Stethoscope, Users, Calendar, FileText, Building2, Printer, Pill } from "lucide-react"
import { type PrescriptionDTO } from "@/api/prescription.api"
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

  const { data: clinicData } = useQuery({
    queryKey: ["clinic", cabinetId],
    queryFn: async () => {
      const { data } = await clinicApi.getById(cabinetId ?? 0)
      console.log(" 1212 Clinic data:", data)
      return data
    },
    enabled: !!cabinetId && cabinetId > 0,
    staleTime: 5 * 60 * 1000,
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
      console.log("Weekly stats data:", data)
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
  const handlePrintOrdonnance = (prescription: PrescriptionDTO) => {
    const printWindow = window.open("", "PRINT", "height=1000,width=800")
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes pour lancer l'impression.")
      return
    }

    const doctorName = userDetails?.name || user?.name || "Médecin"
    const clinicName = clinicData?.name || userDetails?.clinicName || "Cabinet Médical"
    const clinicAddress = clinicData?.address || "Adresse du cabinet"
    const clinicPhone = clinicData?.phone || ""
    const clinicEmail = clinicData?.email || ""
    const now = new Date()
    const currentDate = now.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    const currentTime = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    const prescriptionDate = new Date(prescription.prescriptionDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

    const linesHtml = prescription.lines
      .map((line, index) => {
        const medicationName = line.medicationName || "Médicament"
        const duration = line.durationDays ? `${line.durationDays} jours` : "Selon prescription"
        const comment = line.comment
          ? `<div class="med-comment">📝 ${line.comment}</div>`
          : ""
        const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]
        const color = colors[index % colors.length]
        return `
          <div class="medication-card" style="border-left-color: ${color};">
            <div class="med-number" style="background: ${color};">${index + 1}</div>
            <div class="med-content">
              <div class="med-name">${medicationName}</div>
              <div class="med-dosage">
                <span class="dosage-icon">💊</span>
                ${line.dosage}
              </div>
              <div class="med-duration">
                <span class="duration-icon">📅</span>
                Durée: ${duration}
              </div>
              ${comment}
            </div>
          </div>
        `
      })
      .join("")

    const signatureHtml = prescription.digitalSignature
      ? `
        <div class="signature-section">
          <div class="signature-label">✍️ Signature du médecin</div>
          <img src="${prescription.digitalSignature}" alt="Signature" class="signature-img" />
        </div>
      `
      : `
        <div class="signature-placeholder">
          <div class="signature-line"></div>
          <div class="signature-label-empty">Signature du médecin</div>
        </div>
      `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Ordonnance Médicale - ${doctorName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
              color: #1e293b;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 30px;
            }
            
            .prescription-container {
              max-width: 700px;
              margin: 0 auto;
              background: #fff;
              border-radius: 24px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
              color: #fff;
              padding: 32px;
              position: relative;
              overflow: hidden;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 100%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            }
            
            .header-content {
              position: relative;
              z-index: 1;
            }
            
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
            }
            
            .doctor-info h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 4px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .clinic-name {
              font-size: 16px;
              opacity: 0.95;
              font-weight: 500;
            }
            
            .clinic-details {
              margin-top: 8px;
              font-size: 13px;
              opacity: 0.85;
            }
            
            .clinic-details div {
              margin-top: 2px;
            }
            
            .ordonnance-badge {
              background: rgba(255,255,255,0.2);
              backdrop-filter: blur(10px);
              padding: 16px 24px;
              border-radius: 16px;
              text-align: center;
              border: 1px solid rgba(255,255,255,0.3);
            }
            
            .ordonnance-label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 2px;
              opacity: 0.9;
            }
            
            .ordonnance-number {
              font-size: 24px;
              font-weight: 700;
              margin-top: 4px;
            }
            
            .date-time-bar {
              display: flex;
              justify-content: space-between;
              background: rgba(255,255,255,0.15);
              padding: 12px 20px;
              border-radius: 12px;
              font-size: 13px;
            }
            
            .date-time-item {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .body-content {
              padding: 32px;
            }
            
            .section-title {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 18px;
              font-weight: 600;
              color: #334155;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid #e2e8f0;
            }
            
            .section-icon {
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
            }
            
            .medications-list {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            
            .medication-card {
              display: flex;
              gap: 16px;
              padding: 20px;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 16px;
              border-left: 4px solid #3b82f6;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .med-number {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #3b82f6;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 14px;
              flex-shrink: 0;
            }
            
            .med-content {
              flex: 1;
            }
            
            .med-name {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 8px;
            }
            
            .med-dosage, .med-duration {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              color: #475569;
              margin-bottom: 4px;
            }
            
            .dosage-icon, .duration-icon {
              font-size: 14px;
            }
            
            .med-comment {
              margin-top: 8px;
              padding: 10px 14px;
              background: #fff;
              border-radius: 8px;
              font-size: 13px;
              color: #64748b;
              font-style: italic;
              border: 1px dashed #cbd5e1;
            }
            
            .signature-section {
              margin-top: 32px;
              padding: 24px;
              background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
              border-radius: 16px;
              text-align: center;
            }
            
            .signature-label {
              font-size: 14px;
              color: #7c3aed;
              font-weight: 500;
              margin-bottom: 16px;
            }
            
            .signature-img {
              max-width: 220px;
              height: auto;
              border: 2px solid #e9d5ff;
              padding: 12px;
              border-radius: 12px;
              background: #fff;
            }
            
            .signature-placeholder {
              margin-top: 32px;
              padding: 24px;
              text-align: center;
            }
            
            .signature-line {
              width: 200px;
              height: 2px;
              background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
              margin: 0 auto 12px;
            }
            
            .signature-label-empty {
              font-size: 13px;
              color: #94a3b8;
            }
            
            .footer {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 20px 32px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            
            .footer-text {
              font-size: 12px;
              color: #64748b;
            }
            
            .footer-brand {
              margin-top: 8px;
              font-size: 11px;
              color: #94a3b8;
            }
            
            .watermark {
              position: absolute;
              bottom: 20px;
              right: 20px;
              font-size: 80px;
              opacity: 0.03;
              font-weight: 700;
              pointer-events: none;
            }
            
            @media print {
              body {
                background: #fff;
                padding: 0;
              }
              .prescription-container {
                box-shadow: none;
                border-radius: 0;
              }
              .header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .medication-card {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="prescription-container">
            <div class="header">
              <div class="header-content">
                <div class="header-top">
                  <div class="doctor-info">
                    <h1>🩺 Dr. ${doctorName}</h1>
                    <div class="clinic-name">${clinicName}</div>
                    <div class="clinic-details">
                      ${clinicAddress ? `<div>📍 ${clinicAddress}</div>` : ""}
                      ${clinicPhone ? `<div>📞 ${clinicPhone}</div>` : ""}
                      ${clinicEmail ? `<div>✉️ ${clinicEmail}</div>` : ""}
                    </div>
                  </div>
                  <div class="ordonnance-badge">
                    <div class="ordonnance-label">Ordonnance</div>
                    <div class="ordonnance-number">N° ${prescription.id}</div>
                  </div>
                </div>
                <div class="date-time-bar">
                  <div class="date-time-item">
                    <span>📅</span>
                    <span>Prescription: ${prescriptionDate}</span>
                  </div>
                  <div class="date-time-item">
                    <span>🕐</span>
                    <span>Imprimé: ${currentDate} à ${currentTime}</span>
                  </div>
                </div>
              </div>
              <div class="watermark">℞</div>
            </div>
            
            <div class="body-content">
              <div class="section-title">
                <div class="section-icon">💊</div>
                <span>Prescription médicale</span>
              </div>
              
              <div class="medications-list">
                ${linesHtml}
              </div>
              
              ${signatureHtml}
            </div>
            
            <div class="footer">
              <div class="footer-text">
                Ce document est une ordonnance médicale officielle. Conservez-le précieusement.
              </div>
              <div class="footer-brand">
                ${clinicName} • Généré automatiquement le ${currentDate}
              </div>
            </div>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 400)
  }

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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Bonjour, {userDetails?.name || user?.name || "Médecin"}</h1>
            <p className="text-muted-foreground">Bienvenue sur votre espace médecin</p>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-gradient-to-r from-primary/80 to-accent/80 text-white shadow-lg shadow-primary/30">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {clinicData?.name || userDetails?.clinicName || userDetails?.clinic?.name || "Votre cabinet"}
              </span>
            </div>
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

        {/* Ordonnances de la semaine */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Ordonnances de la Semaine</h2>
            </div>
            <Badge variant="outline">{weeklyPrescriptionsCount} ordonnance(s)</Badge>
          </div>

          {prescriptionsLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Chargement des ordonnances...</span>
            </div>
          )}

          {prescriptionsError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Impossible de charger les ordonnances</span>
            </div>
          )}

          {!prescriptionsLoading && !prescriptionsError && weeklyPrescriptions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
              Aucune ordonnance cette semaine.
            </div>
          )}

          {!prescriptionsLoading && !prescriptionsError && weeklyPrescriptions.length > 0 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {weeklyPrescriptions.slice(0, 10).map((prescription) => (
                <div
                  key={prescription.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        #{prescription.id}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(prescription.prescriptionDate).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm">
                      {prescription.lines.length} médicament(s)
                      {prescription.lines.slice(0, 2).map((l, i) => (
                        <span key={i} className="text-muted-foreground">
                          {i === 0 ? " : " : ", "}
                          {l.medicationName || "Médicament"}
                        </span>
                      ))}
                      {prescription.lines.length > 2 && (
                        <span className="text-muted-foreground">...</span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-primary/20 hover:bg-primary/10"
                    onClick={() => handlePrintOrdonnance(prescription)}
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

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
