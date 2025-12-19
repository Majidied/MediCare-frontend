"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotifications } from "@/lib/notifications-context"
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Edit,
  Trash2,
  Printer,
  AlertCircle,
  Activity,
  ClipboardList,
  Pill,
  CheckCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MOCK_PATIENTS, MOCK_MEDICATIONS, type Patient, type Consultation, type Ordonnance } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { addBillingNotification } = useNotifications()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [consultationDialogOpen, setConsultationDialogOpen] = useState(false)
  const [ordonnanceDialogOpen, setOrdonnanceDialogOpen] = useState(false)
  const [editConsultationId, setEditConsultationId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [newConsultation, setNewConsultation] = useState({
    date: new Date().toISOString().split("T")[0],
    motif: "",
    diagnostic: "",
    traitement: "",
    notes: "",
  })
  const [selectedMedications, setSelectedMedications] = useState<
    Array<{ medicationId: string; posologie: string; duree: string }>
  >([])

  useEffect(() => {
    const foundPatient = MOCK_PATIENTS.find((p) => p.id === params.id)
    if (!foundPatient) {
      router.push("/dashboard/medecin/patients")
    } else {
      setPatient(foundPatient)
    }
  }, [params.id, router])

  if (!patient) return null

  const handleAddConsultation = () => {
    if (!newConsultation.motif || !newConsultation.diagnostic) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    if (isEditMode && editConsultationId) {
      const consultationIndex = patient.consultations?.findIndex((c) => c.id === editConsultationId)
      if (consultationIndex !== undefined && consultationIndex !== -1 && patient.consultations) {
        patient.consultations[consultationIndex] = {
          ...patient.consultations[consultationIndex],
          date: newConsultation.date,
          motif: newConsultation.motif,
          diagnostic: newConsultation.diagnostic,
          traitement: newConsultation.traitement,
          notes: newConsultation.notes,
        }
      }

      toast({
        title: "Consultation modifiée",
        description: "La consultation a été mise à jour avec succès",
      })
    } else {
      const consultation: Consultation = {
        id: Date.now().toString(),
        date: newConsultation.date,
        motif: newConsultation.motif,
        diagnostic: newConsultation.diagnostic,
        traitement: newConsultation.traitement,
        notes: newConsultation.notes,
      }

      if (!patient.consultations) patient.consultations = []
      patient.consultations.push(consultation)

      toast({
        title: "Consultation ajoutée",
        description: "La consultation a été créée avec succès",
      })
    }

    setConsultationDialogOpen(false)
    setIsEditMode(false)
    setEditConsultationId(null)
    setNewConsultation({
      date: new Date().toISOString().split("T")[0],
      motif: "",
      diagnostic: "",
      traitement: "",
      notes: "",
    })
  }

  const handleAddOrdonnance = (consultationId: string) => {
    if (selectedMedications.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un médicament",
        variant: "destructive",
      })
      return
    }

    const consultation = patient.consultations?.find((c) => c.id === consultationId)
    if (!consultation) return

    const ordonnance: Ordonnance = {
      id: Date.now().toString(),
      consultationId,
      date: new Date().toISOString().split("T")[0],
      medications: selectedMedications.map((med) => {
        const medication = MOCK_MEDICATIONS.find((m) => m.id === med.medicationId)
        return {
          name: medication?.name || "",
          dosage: medication?.dosage || "",
          posologie: med.posologie,
          duree: med.duree,
        }
      }),
    }

    consultation.ordonnance = ordonnance
    setOrdonnanceDialogOpen(false)
    setSelectedMedications([])

    toast({
      title: "Ordonnance créée",
      description: "L'ordonnance a été générée avec succès",
    })
  }

  const handleDeleteConsultation = (consultationId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette consultation ?")) {
      patient.consultations = patient.consultations?.filter((c) => c.id !== consultationId)
      toast({
        title: "Consultation supprimée",
        description: "La consultation a été supprimée avec succès",
      })
    }
  }

  const handlePrintOrdonnance = (ordonnance: Ordonnance) => {
    toast({
      title: "Impression",
      description: "L'ordonnance est en cours d'impression...",
    })
  }

  const addMedicationRow = () => {
    setSelectedMedications([...selectedMedications, { medicationId: "", posologie: "", duree: "" }])
  }

  const removeMedicationRow = (index: number) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index))
  }

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...selectedMedications]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedMedications(updated)
  }

  const handleEditConsultation = (consultation: Consultation) => {
    setIsEditMode(true)
    setEditConsultationId(consultation.id)
    setNewConsultation({
      date: consultation.date,
      motif: consultation.motif,
      diagnostic: consultation.diagnostic || "",
      traitement: consultation.traitement || "",
      notes: consultation.notes || "",
    })
    setConsultationDialogOpen(true)
  }

  const handleEndConsultation = (consultation: Consultation) => {
    if (!consultation.diagnostic || !consultation.traitement) {
      toast({
        title: "Erreur",
        description: "La consultation doit avoir un diagnostic et un traitement avant d'être clôturée",
        variant: "destructive",
      })
      return
    }

    const consultationIndex = patient.consultations?.findIndex((c) => c.id === consultation.id)
    if (consultationIndex !== undefined && consultationIndex !== -1 && patient.consultations) {
      patient.consultations[consultationIndex] = {
        ...patient.consultations[consultationIndex],
        status: "terminee",
      }
    }

    addBillingNotification({
      id: `billing-${Date.now()}`,
      type: "billing",
      consultationId: consultation.id,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear(),
      consultationDate: consultation.date,
      motif: consultation.motif,
      diagnostic: consultation.diagnostic,
      traitement: consultation.traitement,
      notes: consultation.notes,
      status: "pending",
      sentBy: "Dr. Sarah Martin",
      sentAt: "À l'instant",
    })

    toast({
      title: "Consultation terminée",
      description: "La secrétaire a été notifiée pour la facturation",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
              <p className="text-muted-foreground">Dossier médical complet</p>
            </div>
          </div>
          <Badge
            className={
              patient.status === "Actif"
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted/10 text-muted-foreground border-muted/20"
            }
          >
            {patient.status}
          </Badge>
        </div>

        {/* Patient Info */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Informations Personnelles
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CIN</p>
                <p className="font-medium">{patient.cin}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Calendar className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date de naissance</p>
                <p className="font-medium">{patient.dateOfBirth}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 border border-success/20">
                <Phone className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
                <Mail className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{patient.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 border border-info/20">
                <MapPin className="w-4 h-4 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adresse</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            </div>
            {patient.mutuelle && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mutuelle</p>
                  <p className="font-medium">{patient.mutuelle}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Consultations */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Consultations ({patient.consultations?.length || 0})
            </h2>
            <Dialog
              open={consultationDialogOpen}
              onOpenChange={(open) => {
                setConsultationDialogOpen(open)
                if (!open) {
                  setIsEditMode(false)
                  setEditConsultationId(null)
                  setNewConsultation({
                    date: new Date().toISOString().split("T")[0],
                    motif: "",
                    diagnostic: "",
                    traitement: "",
                    notes: "",
                  })
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 glow-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle consultation
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Modifier la Consultation" : "Nouvelle Consultation"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newConsultation.date}
                      onChange={(e) => setNewConsultation({ ...newConsultation, date: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="motif">Motif de consultation *</Label>
                    <Input
                      id="motif"
                      value={newConsultation.motif}
                      onChange={(e) => setNewConsultation({ ...newConsultation, motif: e.target.value })}
                      placeholder="Ex: Douleurs abdominales"
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="diagnostic">Diagnostic *</Label>
                    <Textarea
                      id="diagnostic"
                      value={newConsultation.diagnostic}
                      onChange={(e) => setNewConsultation({ ...newConsultation, diagnostic: e.target.value })}
                      placeholder="Diagnostic médical"
                      className="bg-background/50"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="traitement">Traitement</Label>
                    <Textarea
                      id="traitement"
                      value={newConsultation.traitement}
                      onChange={(e) => setNewConsultation({ ...newConsultation, traitement: e.target.value })}
                      placeholder="Traitement prescrit"
                      className="bg-background/50"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newConsultation.notes}
                      onChange={(e) => setNewConsultation({ ...newConsultation, notes: e.target.value })}
                      placeholder="Notes supplémentaires"
                      className="bg-background/50"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setConsultationDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddConsultation} className="bg-primary hover:bg-primary/90">
                      {isEditMode ? "Mettre à jour" : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {patient.consultations && patient.consultations.length > 0 ? (
            <div className="space-y-4">
              {patient.consultations.map((consultation) => (
                <Card
                  key={consultation.id}
                  className="bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/40 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {consultation.date}
                        </Badge>
                        {consultation.status === "terminee" && (
                          <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Terminée</Badge>
                        )}
                        <h3 className="font-semibold">{consultation.motif}</h3>
                      </div>
                      <div className="flex gap-2">
                        {consultation.status !== "terminee" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditConsultation(consultation)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteConsultation(consultation.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Diagnostic:</p>
                        <p>{consultation.diagnostic}</p>
                      </div>
                      {consultation.traitement && (
                        <div>
                          <p className="text-muted-foreground">Traitement:</p>
                          <p>{consultation.traitement}</p>
                        </div>
                      )}
                      {consultation.notes && (
                        <div>
                          <p className="text-muted-foreground">Notes:</p>
                          <p className="text-muted-foreground text-xs">{consultation.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Ordonnance */}
                    {consultation.ordonnance ? (
                      <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Pill className="w-4 h-4 text-primary" />
                            Ordonnance
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintOrdonnance(consultation.ordonnance!)}
                            className="gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimer
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {consultation.ordonnance.medications.map((med, idx) => (
                            <div key={idx} className="text-sm p-2 rounded bg-background/50">
                              <p className="font-medium">
                                {med.name} - {med.dosage}
                              </p>
                              <p className="text-muted-foreground text-xs">{med.posologie}</p>
                              <p className="text-muted-foreground text-xs">Durée: {med.duree}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Dialog
                        open={ordonnanceDialogOpen && editConsultationId === consultation.id}
                        onOpenChange={(open) => {
                          setOrdonnanceDialogOpen(open)
                          if (open) setEditConsultationId(consultation.id)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 bg-transparent"
                            onClick={() => setEditConsultationId(consultation.id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Créer une ordonnance
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Créer une Ordonnance</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Médicaments</Label>
                              <Button size="sm" variant="outline" onClick={addMedicationRow}>
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter
                              </Button>
                            </div>
                            {selectedMedications.map((med, index) => (
                              <div
                                key={index}
                                className="flex gap-2 items-start p-3 rounded-lg bg-background/50 border border-border/50"
                              >
                                <div className="flex-1 space-y-2">
                                  <Select
                                    value={med.medicationId}
                                    onValueChange={(value) => updateMedication(index, "medicationId", value)}
                                  >
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Sélectionner un médicament" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {MOCK_MEDICATIONS.map((medication) => (
                                        <SelectItem key={medication.id} value={medication.id}>
                                          {medication.name} - {medication.dosage} ({medication.form})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Posologie (ex: 1 comprimé 3 fois par jour)"
                                    value={med.posologie}
                                    onChange={(e) => updateMedication(index, "posologie", e.target.value)}
                                    className="bg-background/50"
                                  />
                                  <Input
                                    placeholder="Durée (ex: 7 jours)"
                                    value={med.duree}
                                    onChange={(e) => updateMedication(index, "duree", e.target.value)}
                                    className="bg-background/50"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => removeMedicationRow(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            {selectedMedications.length === 0 && (
                              <div className="text-center p-8 text-muted-foreground">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Aucun médicament ajouté</p>
                              </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setOrdonnanceDialogOpen(false)
                                  setSelectedMedications([])
                                }}
                              >
                                Annuler
                              </Button>
                              <Button
                                onClick={() => handleAddOrdonnance(consultation.id)}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                Générer l'ordonnance
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {consultation.status !== "terminee" && (
                      <Button
                        onClick={() => handleEndConsultation(consultation)}
                        className="w-full mt-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Terminer la consultation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune consultation enregistrée</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
