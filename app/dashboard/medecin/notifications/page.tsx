"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useNotifications } from "@/lib/notifications-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, User, Calendar, Clock, FileText, CheckCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MedecinNotifications() {
  const { notifications, markAsRead } = useNotifications()
  const router = useRouter()

  const handleViewPatient = (notificationId: string, patientId: string) => {
    markAsRead(notificationId)
    const targetUrl = `/dashboard/medecin/patients/${patientId}`
    router.push(targetUrl)
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse mr-2" />
            Urgence
          </Badge>
        )
      case "urgent":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        )
      default:
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Calendar className="w-3 h-3 mr-1" />
            Normal
          </Badge>
        )
    }
  }

  const pendingNotifications = notifications.filter((n) => n.status === "pending")
  const readNotifications = notifications.filter((n) => n.status === "read")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              Notifications Patients
            </h1>
            <p className="text-muted-foreground mt-1">
              Patients envoyés par la secrétaire - {pendingNotifications.length} en attente
            </p>
          </div>
        </div>

        {pendingNotifications.length === 0 && (
          <Card className="glass-card p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Aucune notification en attente</h3>
                <p className="text-muted-foreground mt-1">Tous les patients ont été traités</p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {pendingNotifications.map((notification, index) => (
            <Card
              key={notification.id}
              className="glass-card p-6 hover:scale-[1.01] transition-all duration-300 glow-primary animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{notification.patientName}</h3>
                        <p className="text-sm text-muted-foreground">{notification.patientAge} ans</p>
                      </div>
                    </div>
                    {getUrgencyBadge(notification.urgency)}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date & Heure</p>
                        <p className="text-sm font-medium">
                          {notification.appointmentDate} à {notification.appointmentTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
                      <FileText className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Motif</p>
                        <p className="text-sm font-medium">{notification.reason}</p>
                      </div>
                    </div>

                    {notification.lastVisit && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
                        <Clock className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Dernière visite</p>
                          <p className="text-sm font-medium">{notification.lastVisit}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
                      <User className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Envoyé par</p>
                        <p className="text-sm font-medium">{notification.sentBy}</p>
                      </div>
                    </div>
                  </div>

                  {notification.patientHistory && (
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Historique médical</p>
                      <p className="text-sm">{notification.patientHistory}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">{notification.sentAt}</p>
                  </div>
                </div>

                <div className="flex lg:flex-col gap-2 lg:min-w-[140px] items-center justify-center">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 glow-primary"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleViewPatient(notification.id, notification.patientId)
                    }}
                  >
                    Voir Dossier
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {readNotifications.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mt-8">Notifications Lues</h2>
            {readNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="glass-card p-4 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push(`/dashboard/medecin/patients/${notification.patientId}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{notification.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.appointmentDate} à {notification.appointmentTime}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-muted text-muted-foreground border-muted">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Lu
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
