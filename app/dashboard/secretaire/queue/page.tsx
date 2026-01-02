"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, UserMinus, UserPlus, Send, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/lib/notifications-context"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  time: string
  reason: string
  urgency: "normal" | "urgent" | "emergency"
  status: "scheduled" | "missing" | "inQueue" | "inConsultation"
}

export default function QueuePage() {
  const { toast } = useToast()
  const { addNotification } = useNotifications()

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "a1",
      patientId: "p1",
      patientName: "Ahmed Benali",
      time: "09:00",
      reason: "Contrôle de routine",
      urgency: "normal",
      status: "scheduled",
    },
    {
      id: "a2",
      patientId: "p2",
      patientName: "Fatima Zahra",
      time: "09:30",
      reason: "Consultation urgente",
      urgency: "urgent",
      status: "scheduled",
    },
    {
      id: "a3",
      patientId: "p3",
      patientName: "Mohammed Alami",
      time: "10:00",
      reason: "Renouvellement ordonnance",
      urgency: "normal",
      status: "scheduled",
    },
    {
      id: "a4",
      patientId: "p4",
      patientName: "Khadija Idrissi",
      time: "10:30",
      reason: "Douleurs abdominales",
      urgency: "emergency",
      status: "scheduled",
    },
  ])

  const [queue, setQueue] = useState<Appointment[]>([])
  const [inConsultation, setInConsultation] = useState<Appointment | null>(null)
  const [draggedItem, setDraggedItem] = useState<Appointment | null>(null)

  // Separate appointments by status
  const scheduledAppointments = appointments.filter((a) => a.status === "scheduled")
  const missingAppointments = appointments.filter((a) => a.status === "missing")

  const handleMarkAbsent = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "missing" as const } : apt)),
    )
    toast({
      title: "Patient marqué absent",
      description: "Le rendez-vous a été déplacé dans la section Missing",
    })
  }

  const handleAddToQueue = (appointment: Appointment) => {
    setQueue((prev) => [...prev, { ...appointment, status: "inQueue" }])
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointment.id))
    toast({
      title: "Patient ajouté à la file",
      description: `${appointment.patientName} a été ajouté à la file d'attente`,
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
      setQueue((prev) => [...prev, { ...draggedItem, status: "inQueue" }])
      setAppointments((prev) => prev.map((apt) => (apt.id === draggedItem.id ? { ...apt, status: "inQueue" } : apt)))
      toast({
        title: "Patient ajouté à la file",
        description: `${draggedItem.patientName} est maintenant en attente`,
      })
    }
    setDraggedItem(null)
  }

  const handleDropInQueue = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedItem) return

    const draggedIndex = queue.findIndex((item) => item.id === draggedItem.id)
    if (draggedIndex === -1) return

    const newQueue = [...queue]
    newQueue.splice(draggedIndex, 1)
    newQueue.splice(targetIndex, 0, draggedItem)
    setQueue(newQueue)
    setDraggedItem(null)
  }

  const handleSendToDoctor = () => {
    if (queue.length === 0) return

    const patient = queue[0]
    setInConsultation(patient)
    setQueue((prev) => prev.slice(1))

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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Liste d'attente & Rendez-vous
          </h1>
          <p className="text-muted-foreground mt-2">Gérez les rendez-vous du jour et la file d'attente</p>
        </div>

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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAbsent(appointment.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {scheduledAppointments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Aucun rendez-vous planifié</div>
                )}
              </div>
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
                  <Button onClick={handleSendToDoctor} className="glow-primary shrink-0 w-full sm:w-auto">
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer au médecin
                  </Button>
                )}
              </div>

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
                      Glissez-déposez les patients ici ou ajoutez-les depuis la section "Absents"
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
