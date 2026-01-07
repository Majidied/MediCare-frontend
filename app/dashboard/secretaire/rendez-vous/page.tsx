"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight, Clock, User, AlertCircle, Edit2, Trash2 } from "lucide-react"
import { useState, useMemo } from "react"

import { useToast } from "@/hooks/use-toast"
import { usePatients } from "@/hooks/use-patient"
import {
  useAppointmentsByDate,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useUpdateAppointmentStatus
} from "@/hooks/use-appointment"
import { appointmentHelpers, MotifRDV } from "@/api/appointment.api"
import { getLocalDateString } from "@/lib/date.utils"
import { useAuth } from "@/lib/auth-context"
import { useCurrentUser } from "@/hooks/use-user"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  motif: MotifRDV
  status: "confirmé" | "en_attente" | "annulé"
  notes?: string
}

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

export default function RendezVousPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch user details directly using React Query
  const { data: userDetails } = useCurrentUser(user?.email)
  const cabinetId = userDetails?.clinicId ?? 0

  // Debug logging
  console.log("[RendezVousPage] User from auth:", user)
  console.log("[RendezVousPage] User details from API:", userDetails)
  console.log("[RendezVousPage] Cabinet ID:", cabinetId)

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    motif: "" as MotifRDV | "",
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // API hooks
  const selectedDateStr = formatDate(selectedDate)
  const { data: appointmentsData = [], isLoading } = useAppointmentsByDate(selectedDateStr, cabinetId)
  const { data: patients = [], isLoading: isLoadingPatients } = usePatients()
  const createMutation = useCreateAppointment()
  const updateMutation = useUpdateAppointment()
  const deleteMutation = useDeleteAppointment()
  const updateStatusMutation = useUpdateAppointmentStatus()

  // Transform backend appointments to frontend format
  const appointments = useMemo(() => {
    return appointmentsData.map(apt => appointmentHelpers.toFrontend(apt))
  }, [appointmentsData])

  function formatDate(date: Date) {
    return getLocalDateString(date)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDate(date)
    return appointments.filter((apt) => apt.date === dateStr)
  }

  const getAppointmentForSlot = (date: string, time: string) => {
    return appointments.find((apt) => apt.date === date && apt.time === time)
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleSlotClick = (time: string) => {
    const dateStr = formatDate(selectedDate)
    const existingAppointment = getAppointmentForSlot(dateStr, time)

    if (existingAppointment) {
      setSelectedAppointment(existingAppointment)
      setIsDetailsDialogOpen(true)
    } else {
      setSelectedSlot({ date: dateStr, time })
      setFormData({ patientId: "", motif: "", notes: "" })
      setErrors({})
      setIsCreateDialogOpen(true)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.patientId) {
      newErrors.patientId = "Veuillez sélectionner un patient"
    }
    if (!formData.motif.trim()) {
      newErrors.motif = "Le motif est obligatoire"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm() || !selectedSlot) return

    const patient = patients.find((p) => p.id.toString() === formData.patientId)
    if (!patient) return

    const patientName = `${patient.prenom} ${patient.nom}`

    try {
      const requestData = appointmentHelpers.toBackendRequest(
        parseInt(formData.patientId),
        cabinetId,
        selectedSlot.date,
        selectedSlot.time,
        formData.motif as MotifRDV,
        formData.notes
      )

      await createMutation.mutateAsync(requestData)

      setIsCreateDialogOpen(false)
      toast({
        title: "Rendez-vous créé",
        description: `Rendez-vous avec ${patientName} créé pour le ${selectedSlot.date} à ${selectedSlot.time}`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!validateForm() || !selectedAppointment) return

    const patient = patients.find((p) => p.id.toString() === formData.patientId)
    if (!patient) return

    try {
      await updateMutation.mutateAsync({
        id: parseInt(selectedAppointment.id),
        data: {
          patientId: parseInt(formData.patientId),
          cabinetId: cabinetId,
          date: selectedAppointment.date,
          Heure_debut: selectedAppointment.time,
          Heure_fin: "", // Will be calculated by backend
          motifRDV: formData.motif as MotifRDV,
          notes: formData.notes,
        }
      })

      setIsEditDialogOpen(false)
      setIsDetailsDialogOpen(false)
      toast({
        title: "Rendez-vous modifié",
        description: "Les informations du rendez-vous ont été mises à jour",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rendez-vous",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (appointment: Appointment) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce rendez-vous ?`)) return

    try {
      await deleteMutation.mutateAsync(parseInt(appointment.id))

      setIsDetailsDialogOpen(false)
      toast({
        title: "Rendez-vous supprimé",
        description: "Le rendez-vous a été supprimé avec succès",
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rendez-vous",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (appointmentId: string, newStatus: "confirmé" | "en_attente" | "annulé") => {
    try {
      const backendStatus = appointmentHelpers.toBackendStatus(newStatus)
      await updateStatusMutation.mutateAsync({
        id: parseInt(appointmentId),
        status: backendStatus
      })

      toast({
        title: "Statut mis à jour",
        description: `Le statut a été changé à "${newStatus}"`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setFormData({
      patientId: appointment.patientId,
      motif: appointment.motif,
      notes: appointment.notes || "",
    })
    setErrors({})
    setIsDetailsDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmé":
        return "bg-success/10 text-success border-success/20"
      case "en_attente":
        return "bg-warning/10 text-warning border-warning/20"
      case "annulé":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-primary/10 text-primary border-primary/20"
    }
  }

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  const days = getDaysInMonth(currentMonth)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Rendez-vous</h1>
          <p className="text-muted-foreground">Planifiez et gérez les rendez-vous des patients</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="glass-card p-6 lg:col-span-1">
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="font-semibold">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2">
                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                  {dayNames.map((day) => (
                    <div key={day} className="py-2 font-medium">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square" />
                    }

                    const isSelected = formatDate(day) === selectedDateStr
                    const isToday = formatDate(day) === formatDate(new Date())
                    const dayAppointments = getAppointmentsForDate(day)
                    const hasAppointments = dayAppointments.length > 0

                    return (
                      <button
                        key={formatDate(day)}
                        onClick={() => handleDateClick(day)}
                        className={`
                          aspect-square rounded-lg text-sm font-medium transition-all relative
                          ${isSelected ? "bg-primary text-primary-foreground glow-primary" : "hover:bg-primary/10"}
                          ${isToday && !isSelected ? "border-2 border-primary" : ""}
                        `}
                      >
                        {day.getDate()}
                        {hasAppointments && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayAppointments.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1 h-1 rounded-full bg-accent" />
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="pt-4 border-t border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-success/20 border border-success/40" />
                  <span className="text-muted-foreground">Confirmé</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-warning/20 border border-warning/40" />
                  <span className="text-muted-foreground">En attente</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" />
                  <span className="text-muted-foreground">Annulé</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Time Slots */}
          <Card className="glass-card p-6 lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {isLoading ? "..." : `${getAppointmentsForDate(selectedDate).length} RDV`}
                </Badge>
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chargement des rendez-vous...
                  </div>
                ) : (
                  TIME_SLOTS.map((time) => {
                    const appointment = getAppointmentForSlot(selectedDateStr, time)
                    const isBooked = !!appointment

                    return (
                      <button
                        key={time}
                        onClick={() => handleSlotClick(time)}
                        className={`
                        w-full p-4 rounded-lg border-2 transition-all text-left
                        ${isBooked
                            ? appointment.status === "confirmé"
                              ? "bg-success/10 border-success/30 hover:bg-success/20"
                              : appointment.status === "en_attente"
                                ? "bg-warning/10 border-warning/30 hover:bg-warning/20"
                                : "bg-destructive/10 border-destructive/30 hover:bg-destructive/20"
                            : "border-border/50 hover:bg-primary/5 hover:border-primary/30"
                          }
                      `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono font-medium">{time}</span>
                            </div>
                            {isBooked && appointment && (
                              <>
                                <div className="h-4 w-px bg-border" />
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{appointment.patientName}</span>
                                </div>
                                <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                                  {appointment.status}
                                </Badge>
                              </>
                            )}
                            {!isBooked && <span className="text-sm text-muted-foreground">Disponible</span>}
                          </div>
                          {isBooked && appointment && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {appointment.motif}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Create Appointment Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau Rendez-vous</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{selectedSlot?.date}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{selectedSlot?.time}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                >
                  <SelectTrigger className={errors.patientId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner un patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingPatients ? (
                      <SelectItem value="loading" disabled>
                        Chargement des patients...
                      </SelectItem>
                    ) : patients.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Aucun patient disponible
                      </SelectItem>
                    ) : (
                      patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.prenom} {patient.nom} - {patient.cin}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.patientId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.patientId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="motif">Motif *</Label>
                <Select
                  value={formData.motif}
                  onValueChange={(value) => setFormData({ ...formData, motif: value as MotifRDV })}
                >
                  <SelectTrigger className={errors.motif ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSULTATION">Consultation</SelectItem>
                    <SelectItem value="CONTROL">Contrôle</SelectItem>
                  </SelectContent>
                </Select>
                {errors.motif && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.motif}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes additionnelles..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                className="glow-primary"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appointment Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle>Détails du Rendez-vous</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedAppointment.patientName}</span>
                  </div>
                  <Badge className={getStatusColor(selectedAppointment.status)}>{selectedAppointment.status}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedAppointment.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedAppointment.time}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Motif</Label>
                  <p className="text-sm">{selectedAppointment.motif}</p>
                </div>

                {selectedAppointment.notes && (
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Changer le statut</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedAppointment.status === "confirmé" ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedAppointment.id, "confirmé")}
                      className="flex-1"
                      disabled={updateStatusMutation.isPending}
                    >
                      Confirmé
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedAppointment.status === "en_attente" ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedAppointment.id, "en_attente")}
                      className="flex-1"
                      disabled={updateStatusMutation.isPending}
                    >
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedAppointment.status === "annulé" ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedAppointment.id, "annulé")}
                      className="flex-1"
                      disabled={updateStatusMutation.isPending}
                    >
                      Annulé
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => openEditDialog(selectedAppointment)}
                    className="flex-1 gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(selectedAppointment)}
                    className="flex-1 gap-2 text-destructive hover:bg-destructive/10"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Appointment Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier le Rendez-vous</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedAppointment && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedAppointment.date}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{selectedAppointment.time}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-patient">Patient *</Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                >
                  <SelectTrigger className={errors.patientId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner un patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingPatients ? (
                      <SelectItem value="loading" disabled>
                        Chargement des patients...
                      </SelectItem>
                    ) : patients.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Aucun patient disponible
                      </SelectItem>
                    ) : (
                      patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.prenom} {patient.nom} - {patient.cin}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.patientId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.patientId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-motif">Motif *</Label>
                <Select
                  value={formData.motif}
                  onValueChange={(value) => setFormData({ ...formData, motif: value as MotifRDV })}
                >
                  <SelectTrigger className={errors.motif ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSULTATION">Consultation</SelectItem>
                    <SelectItem value="CONTROL">Contrôle</SelectItem>
                  </SelectContent>
                </Select>
                {errors.motif && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.motif}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleEdit}
                className="glow-primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
