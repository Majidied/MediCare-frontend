"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, UserMinus, UserPlus, Send, GripVertical, RefreshCw, X, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/lib/notifications-context"
import { useAppointmentsByDate } from "@/hooks/use-appointment"
import { useQueue, useAddToQueue, useRemoveFromQueue, useCallNext, useReorderQueue } from "@/hooks/use-queue"
import { appointmentHelpers } from "@/api/appointment.api"

const CABINET_ID = 1 // In real app, get from auth context
const AUTO_REFRESH_INTERVAL = 30000 // 30 seconds

interface Appointment {
  id: string
  patientId: string
  patientName: string
  time: string
  reason: string
  urgency: "normal" | "urgent" | "emergency"
  status: "scheduled" | "missing" | "inQueue" | "inConsultation"
  queuePosition?: number
}

export default function QueuePage() {
  const { toast } = useToast()
  const { addNotification } = useNotifications()

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }, [])

  // Fetch today's appointments and queue
  const { data: appointmentsRaw = [], isLoading: isLoadingAppointments, error: appointmentsError, refetch: refetchAppointments } = useAppointmentsByDate(today, CABINET_ID)
  const { data: queueRaw = [], isLoading: isLoadingQueue, error: queueError, refetch: refetchQueue } = useQueue(today, CABINET_ID)

  // Auto-refresh setup
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchAppointments()
      refetchQueue()
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [refetchAppointments, refetchQueue])

  // Manual refresh handler
  const handleRefresh = () => {
    refetchAppointments()
    refetchQueue()
    toast({
      title: "Rafraîchissement",
      description: "Les données ont été actualisées",
    })
  }

  // Mutations
  const addToQueueMutation = useAddToQueue()
  const removeFromQueueMutation = useRemoveFromQueue()
  const callNextMutation = useCallNext()
  const reorderQueueMutation = useReorderQueue()

  // Convert backend data to frontend format
  const appointments = useMemo(() => {
    return appointmentsRaw
      .filter(apt => apt.statutRDV === 'CONFIRME') // Only show confirmed appointments not in queue
      .map((apt: any) => {
        const frontendApt = appointmentHelpers.toFrontend(apt)
        return {
          id: frontendApt.id,
          patientId: frontendApt.patientId,
          patientName: frontendApt.patientName,
          time: frontendApt.time,
          reason: frontendApt.motif,
          urgency: "normal" as const, // Can be enhanced based on motif or other fields
          status: "scheduled" as const,
        }
      })
  }, [appointmentsRaw])

  const queue = useMemo(() => {
    return queueRaw.map((apt: any) => {
      const frontendApt = appointmentHelpers.toFrontend(apt)
      return {
        id: frontendApt.id,
        patientId: frontendApt.patientId,
        patientName: frontendApt.patientName,
        time: frontendApt.time,
        reason: frontendApt.motif,
        urgency: "normal" as const,
        status: "inQueue" as const,
        queuePosition: apt.queuePosition,
      }
    }).sort((a: any, b: any) => (a.queuePosition || 0) - (b.queuePosition || 0))
  }, [queueRaw])

  const [inConsultation, setInConsultation] = useState<Appointment | null>(null)
  const [draggedItem, setDraggedItem] = useState<Appointment | null>(null)

  // Separate appointments by status (missing appointments to be tracked separately)
  const scheduledAppointments = appointments
  const missingAppointments: Appointment[] = [] // Can be tracked via MISSING status if needed

  const handleRemoveFromQueue = (appointmentId: string) => {
    removeFromQueueMutation.mutate(Number(appointmentId), {
      onSuccess: () => {
        toast({
          title: "Patient retiré de la file",
          description: "Le patient a été retiré de la file d'attente",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de retirer le patient de la file",
          variant: "destructive",
        })
      }
    })
  }

  const handleMarkAbsent = (appointmentId: string) => {
    // TODO: Implement with API to update status to MISSING
    toast({
      title: "Patient marqué absent",
      description: "Le rendez-vous a été marqué comme absent",
    })
  }

  const handleAddToQueue = (appointment: Appointment) => {
    addToQueueMutation.mutate(Number(appointment.id), {
      onSuccess: () => {
        toast({
          title: "Patient ajouté à la file",
          description: `${appointment.patientName} a été ajouté à la file d'attente`,
        })
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'ajouter le patient à la file",
          variant: "destructive",
        })
      }
    })
  }

  const handleDragStart = (e: React.DragEvent, appointment: Appointment, source: "scheduled" | "queue") => {
    setDraggedItem(appointment)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("source", source)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDropToQueue = (e: React.DragEvent) => {
    e.preventDefault()
    const source = e.dataTransfer.getData("source")

    if (draggedItem && source === "scheduled") {
      addToQueueMutation.mutate(Number(draggedItem.id), {
        onSuccess: () => {
          toast({
            title: "Patient ajouté à la file",
            description: `${draggedItem.patientName} est maintenant en attente`,
          })
        },
        onError: (error: any) => {
          toast({
            title: "Erreur",
            description: error.message || "Impossible d'ajouter le patient à la file",
            variant: "destructive",
          })
        }
      })
    }
    setDraggedItem(null)
  }

  const handleDropInQueue = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedItem) return

    const draggedIndex = queue.findIndex((item) => item.id === draggedItem.id)
    if (draggedIndex === -1) return

    // Create new order
    const newQueue = [...queue]
    newQueue.splice(draggedIndex, 1)
    newQueue.splice(targetIndex, 0, draggedItem)

    // Extract appointment IDs in new order
    const appointmentIds = newQueue.map(apt => Number(apt.id))

    // Call reorder API
    reorderQueueMutation.mutate({
      cabinetId: CABINET_ID,
      date: today,
      appointmentIds,
    }, {
      onSuccess: () => {
        toast({
          title: "File d'attente réorganisée",
          description: "L'ordre de la file a été mis à jour",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de réorganiser la file",
          variant: "destructive",
        })
      }
    })
    
    setDraggedItem(null)
  }

  const handleSendToDoctor = () => {
    if (queue.length === 0) return

    const patient = queue[0]
    
    callNextMutation.mutate(Number(patient.id), {
      onSuccess: () => {
        setInConsultation(patient)

        // Send notification to doctor
        addNotification({
          id: `notif-${Date.now()}`,
          patientId: patient.patientId,
          patientName: patient.patientName,
          patientAge: 35,
          appointmentTime: patient.time,
          appointmentDate: "Aujourd'hui",
          reason: patient.reason,
          urgency: patient.urgency,
          status: "pending",
          sentBy: "Secrétaire",
          sentAt: "À l'instant",
        })

        toast({
          title: "Patient envoyé au médecin",
          description: `${patient.patientName} est maintenant en consultation`,
        })
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'envoyer le patient en consultation",
          variant: "destructive",
        })
      }
    })
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "urgent":
        return "bg-warning/10 text-warning border-warning/20"
      default:
        return "bg-primary/10 text-primary border-primary/20"
    }
  }

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "Urgence"
      case "urgent":
        return "Urgent"
      default:
        return "Normal"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Liste d'attente & Rendez-vous
            </h1>
            <p className="text-muted-foreground mt-2">Gérez les rendez-vous du jour et la file d'attente</p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoadingAppointments || isLoadingQueue}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingAppointments || isLoadingQueue ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-primary/20 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Rendez-vous du jour</p>
              </div>
            </div>
          </Card>
          
          <Card className="glass-card border-accent/20 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <UserPlus className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{queue.length}</p>
                <p className="text-sm text-muted-foreground">En file d'attente</p>
              </div>
            </div>
          </Card>
          
          <Card className="glass-card border-green-500/20 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inConsultation ? 1 : 0}</p>
                <p className="text-sm text-muted-foreground">En consultation</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Error Messages */}
        {(appointmentsError || queueError) && (
          <Card className="glass-card border-destructive/20 p-4 bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Erreur de chargement</p>
                <p className="text-sm text-muted-foreground">
                  {appointmentsError?.message || queueError?.message || "Impossible de charger les données"}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side - Today's Appointments */}
          <div className="space-y-6">
            {/* Scheduled Appointments */}
            <Card className="glass-card border-primary/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Rendez-vous du jour</h2>
                  <p className="text-sm text-muted-foreground">{scheduledAppointments.length} rendez-vous planifiés</p>
                </div>
              </div>

              {isLoadingAppointments ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50 animate-pulse h-24" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appointment, "scheduled")}
                      className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all cursor-move"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{appointment.patientName}</p>
                              <Badge className={getUrgencyColor(appointment.urgency)}>
                                {getUrgencyLabel(appointment.urgency)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {appointment.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddToQueue(appointment)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="Ajouter à la file"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAbsent(appointment.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Marquer absent"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {scheduledAppointments.length === 0 && !isLoadingAppointments && (
                    <div className="text-center py-8 text-muted-foreground">Aucun rendez-vous planifié</div>
                  )}
                </div>
              )}
            </Card>

            {/* Missing Appointments */}
            {missingAppointments.length > 0 && (
              <Card className="glass-card border-destructive/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Patients absents</h2>
                    <p className="text-sm text-muted-foreground">{missingAppointments.length} patient(s) absent(s)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {missingAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{appointment.patientName}</p>
                            <Badge className={getUrgencyColor(appointment.urgency)}>
                              {getUrgencyLabel(appointment.urgency)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {appointment.time}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToQueue(appointment)}
                          className="border-primary/20 hover:bg-primary/10"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Side - Queue & In Consultation */}
          <div className="space-y-6">
            {/* In Consultation */}
            {inConsultation && (
              <Card className="glass-card border-accent/20 p-6 glow-accent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                    <Send className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">En consultation</h2>
                    <p className="text-sm text-muted-foreground">Patient actuellement chez le médecin</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-lg">{inConsultation.patientName}</p>
                    <Badge className={getUrgencyColor(inConsultation.urgency)}>
                      {getUrgencyLabel(inConsultation.urgency)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{inConsultation.reason}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Heure prévue: {inConsultation.time}
                  </p>
                </div>
              </Card>
            )}

            {/* Queue */}
            <Card className="glass-card border-primary/20 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">File d'attente</h2>
                    <p className="text-sm text-muted-foreground">{queue.length} patient(s) en attente</p>
                  </div>
                </div>
                {queue.length > 0 && (
                  <Button 
                    onClick={handleSendToDoctor} 
                    className="glow-primary shrink-0 w-full sm:w-auto"
                    disabled={callNextMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer au médecin
                  </Button>
                )}
              </div>

              {isLoadingQueue ? (
                <div className="min-h-[400px] p-4 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5">
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/50 animate-pulse h-24" />
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDropToQueue}
                  className="min-h-[400px] p-4 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5"
                >
                  {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <UserPlus className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">File d'attente vide</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Glissez-déposez les patients ici ou ajoutez-les depuis la section "Rendez-vous du jour"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {queue.map((appointment, index) => (
                        <div
                          key={appointment.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, appointment, "queue")}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropInQueue(e, index)}
                          className={`p-4 rounded-lg bg-card border transition-all cursor-move ${index === 0
                            ? "border-primary/50 shadow-lg shadow-primary/20 glow-primary"
                            : "border-border hover:border-primary/30"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{appointment.patientName}</p>
                                <Badge className={getUrgencyColor(appointment.urgency)}>
                                  {getUrgencyLabel(appointment.urgency)}
                                </Badge>
                                {index === 0 && (
                                  <Badge className="bg-accent/10 text-accent border-accent/20">Suivant</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Prévu à {appointment.time}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromQueue(appointment.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Retirer de la file"
                              disabled={removeFromQueueMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
