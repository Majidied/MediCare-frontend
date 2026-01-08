"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { Bell, Clock, CheckCircle, AlertCircle, Loader2, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const { notifications, markAsRead, isLoading } = useNotifications()
  const router = useRouter()

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleViewPatient = async (notification: any) => {
    // Mark as read when viewing
    if (notification.status === 'pending') {
      await markAsRead(notification.id)
    }
    
    // Navigate to patient details using patientId
    if (notification.patientId) {
      router.push(`/dashboard/medecin/patients/${notification.patientId}`)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PATIENT_CONSULTATION':
        return <Bell className="w-5 h-5 text-blue-500" />
      case 'SUBSCRIPTION_EXPIRATION_ALERT':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr })
    } catch {
      return dateString
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Gérez vos notifications et alertes</p>
          </div>
          {notifications.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Bell className="w-3 h-3" />
              {notifications.filter(n => n.status === 'pending').length} non lues
            </Badge>
          )}
        </div>

        {isLoading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Chargement des notifications...</span>
            </div>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune notification pour le moment</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              // Debug log to check notification data
              console.log('Notification:', {
                id: notification.id,
                type: notification.type,
                appointmentId: notification.appointmentId,
                hasAppointmentId: !!notification.appointmentId
              })
              
              return (
              <Card
                key={notification.id}
                className={`p-4 transition-all hover:border-primary/50 ${
                  notification.status === "pending" ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.content}
                        </p>
                      </div>
                      {notification.status === "pending" && (
                        <Badge variant="default" className="shrink-0">
                          Nouveau
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(notification.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {notification.type === "PATIENT_CONSULTATION" && notification.appointmentId && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleViewPatient(notification)}
                            className="h-7 text-xs gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Voir
                          </Button>
                        )}
                        
                        {notification.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-7 text-xs gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Marquer comme lu
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
