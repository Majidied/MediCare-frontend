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
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/lib/auth-context"
import { useCurrentUser } from "@/hooks/use-user"
import { consultationApi, type ConsultationDTO, type ConsultationSummaryDTO } from "@/api/consultation.api"
import { rdvApi, type StatutRDV } from "@/api/rdv.api"
import { medicationApi, type MedicationDTO } from "@/api/medication.api"
import { prescriptionApi, type PrescriptionDTO, type PrescriptionLineDTO } from "@/api/prescription.api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  User,
  Calendar,
  Phone,
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
  Loader2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { usePatient } from "@/hooks/use-patient"
import { type Patient } from "@/api/patient.api"

export default function PatientDetailsPage() {
  type ConsultationViewModel = ConsultationSummaryDTO & {
    rendezVousId?: number
    patientId?: number
    medecinId?: number
    cabinetId?: number
    examenClinique?: string
    examenSupplementaire?: string
    traitement?: string
    observations?: string
    status?: string
    prescription?: PrescriptionDTO
  }

  const params = useParams<{ id: string }>()
  const patientId = typeof params?.id === "string" ? Number(params.id) : Number.NaN
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0
  const { user } = useAuth()
  const { data: userDetails } = useCurrentUser(user?.email)
  const medecinId = userDetails?.id ?? 0
  const { toast } = useToast()
  const { addBillingNotification } = useNotifications()
  const queryClient = useQueryClient()
  const { data: patientData, isLoading, isError, error } = usePatient(isValidPatientId ? patientId : 0)
  const {
    data: consultationsData,
    isLoading: consultationsLoading,
    isError: consultationsError,
    error: consultationsErrorObj,
  } = useQuery({
    queryKey: ["consultations", "patient", patientId],
    queryFn: async () => {
      const { data } = await consultationApi.getByPatient(patientId)
      return data
    },
    enabled: isValidPatientId,
    refetchOnWindowFocus: false,
  })
  const { data: medications = [], isLoading: medicationsLoading, isError: medicationsError } = useQuery({
    queryKey: ["medications", "all"],
    queryFn: async () => {
      const { data } = await medicationApi.getAll()
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
  const { data: patientPrescriptions = [], isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["prescriptions", "patient", patientId],
    queryFn: async () => {
      const { data } = await prescriptionApi.getByPatient(patientId)
      return data
    },
    enabled: isValidPatientId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  const {
    data: todayRdv,
    isLoading: todayRdvLoading,
    isError: todayRdvError,
    error: todayRdvErrorObj,
  } = useQuery({
    queryKey: ["rdv", "today", patientId],
    queryFn: () => rdvApi.getTodayForPatient(patientId),
    enabled: isValidPatientId,
    refetchOnWindowFocus: false,
  })
  const updateConsultationMutation = useMutation({
    mutationFn: async ({ consultationId, payload }: { consultationId: number; payload: Partial<ConsultationDTO> }) => {
      const { data } = await consultationApi.update(consultationId, payload)
      return data
    },
  })
  const createConsultationMutation = useMutation({
    mutationFn: async (payload: Partial<ConsultationDTO>) => {
      const { data } = await consultationApi.create(payload)
      return data
    },
  })
  const deleteConsultationMutation = useMutation({
    mutationFn: (consultationId: number) => consultationApi.delete(consultationId),
  })
  const [patient, setPatient] = useState<Patient | null>(null)
  const [consultations, setConsultations] = useState<ConsultationViewModel[]>([])
  const [consultationDialogOpen, setConsultationDialogOpen] = useState(false)
  const [ordonnanceDialogOpen, setOrdonnanceDialogOpen] = useState(false)
  const [editConsultationId, setEditConsultationId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [newConsultation, setNewConsultation] = useState({
    dateConsultation: new Date().toISOString(),
    type: "CONSULTATION",
    diagnostic: "",
    traitement: "",
    observations: "",
  })
  const [selectedMedications, setSelectedMedications] = useState<
    Array<{ medicationId: number | ""; posologie: string; duree: string; commentaire?: string }>
  >([])

  const updateConsultationsState = (
    updater: ConsultationViewModel[] | ((prev: ConsultationViewModel[]) => ConsultationViewModel[]),
  ) => {
    setConsultations((prev) => {
      const nextState = typeof updater === "function" ? (updater as (p: ConsultationViewModel[]) => ConsultationViewModel[])(prev) : updater
      queryClient.setQueryData(["consultations", "patient", patientId], nextState)
      return nextState
    })
  }

  useEffect(() => {
    if (patientData) {
      setPatient({ ...patientData })
    }
  }, [patientData])

  useEffect(() => {
    if (consultationsData) {
      const merged = consultationsData.map((c) => ({
        ...c,
        prescription: patientPrescriptions.find((p) => p.consultationId === c.id),
      }))
      updateConsultationsState(merged)
    }
  }, [consultationsData, patientPrescriptions])

  if (!isValidPatientId) {
    return (
      <DashboardLayout>
        <Card className="p-6 flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Identifiant patient invalide</span>
        </Card>
      </DashboardLayout>
    )
  }

  if (isLoading || consultationsLoading || todayRdvLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Chargement du patient...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (isError || consultationsError || todayRdvError || !patient) {
    return (
      <DashboardLayout>
        <Card className="p-6 flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>
            Erreur :
            {(error as any)?.message ||
              (consultationsErrorObj as any)?.message ||
              (todayRdvErrorObj as any)?.message ||
              "Impossible de charger le patient"}
          </span>
        </Card>
      </DashboardLayout>
    )
  }

  const ineligibleStatuses: StatutRDV[] = ["TERMINE", "ANNULE", "CONFIRME", "MISSING"]
  const hasEligibleRdv = !!todayRdv && !ineligibleStatuses.includes(todayRdv.statutRDV)
  console.log("Status today RDV:", todayRdv?.statutRDV, "Has eligible RDV:", hasEligibleRdv)
  const hasConsultationForTodayRdv =
    !!todayRdv?.id &&
    consultations.some((consultation) => {
      const consultationDetails = consultation as Partial<ConsultationDTO>
      return consultationDetails.rendezVousId === todayRdv.id
    })

  const handleAddConsultation = async () => {
    if (!newConsultation.type || !newConsultation.diagnostic) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    if (!hasEligibleRdv || !todayRdv?.id) {
      toast({
        title: "Rendez-vous requis",
        description: "Aucun rendez-vous valide pour aujourd'hui. Impossible de créer la consultation.",
        variant: "destructive",
      })
      return
    }

    if (!isEditMode && hasConsultationForTodayRdv) {
      toast({
        title: "Consultation existante",
        description: "Une consultation est déjà liée à ce rendez-vous.",
        variant: "destructive",
      })
      return
    }

    const currentRdv = todayRdv as NonNullable<typeof todayRdv>

    if (isEditMode && editConsultationId) {
      const existing = consultations.find((c) => c.id === Number(editConsultationId))
      if (!existing) {
        toast({ title: "Erreur", description: "Consultation introuvable", variant: "destructive" })
        return
      }

      const rendezVousIdToSend = existing.rendezVousId ?? todayRdv?.id
      if (!rendezVousIdToSend) {
        toast({
          title: "Rendez-vous manquant",
          description: "Impossible de mettre à jour sans identifiant de rendez-vous.",
          variant: "destructive",
        })
        return
      }

      try {
        const payload: Partial<ConsultationDTO> = {
          id: existing.id,
          rendezVousId: rendezVousIdToSend,
          patientId,
          medecinId: existing.medecinId ?? medecinId,
          cabinetId: (patient as Patient).cabinetId ?? 0,
          type: newConsultation.type,
          dateConsultation: newConsultation.dateConsultation,
          diagnostic: newConsultation.diagnostic,
          traitement: newConsultation.traitement,
          observations: newConsultation.observations,
          examenClinique: existing.examenClinique,
          examenSupplementaire: existing.examenSupplementaire,
          archived: existing.archived,
          archivedAt: existing.archivedAt,
        }

        const updated = await updateConsultationMutation.mutateAsync({
          consultationId: Number(editConsultationId),
          payload,
        })

        updateConsultationsState((prev) => prev.map((c) => (c.id === Number(editConsultationId) ? { ...c, ...updated } : c)))

        toast({
          title: "Consultation modifiée",
          description: "La consultation a été mise à jour avec succès",
        })
      } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.response?.data?.message || "Impossible de mettre à jour la consultation",
          variant: "destructive",
        })
        return
      }
    } else {
      try {
        const payload: Partial<ConsultationDTO> = {
          patientId,
          medecinId,
          cabinetId: currentRdv.cabinetId ?? 0,
          rendezVousId: currentRdv.id,
          type: newConsultation.type,
          dateConsultation: newConsultation.dateConsultation,
          diagnostic: newConsultation.diagnostic,
          traitement: newConsultation.traitement,
          observations: newConsultation.observations,
          archived: false,
          archivedAt: undefined,
        }

        const created = await createConsultationMutation.mutateAsync(payload)
        const viewModel: ConsultationViewModel = {
          ...created,
          diagnostic: created.diagnostic ?? "",
          status: created.archived ? "terminee" : undefined,
        }
        updateConsultationsState((prev) => [...prev, viewModel])

        toast({
          title: "Consultation ajoutée",
          description: "La consultation a été créée avec succès",
        })
      } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.response?.data?.message || "Impossible de créer la consultation",
          variant: "destructive",
        })
        return
      }
    }

    setConsultationDialogOpen(false)
    setIsEditMode(false)
    setEditConsultationId(null)
    setNewConsultation({
      dateConsultation: new Date().toISOString(),
      type: "CONSULTATION",
      diagnostic: "",
      traitement: "",
      observations: "",
    })
  }

  const handleAddOrdonnance = async (consultationId: number) => {
    const validLines = selectedMedications.filter((m) => m.medicationId !== "")

    if (validLines.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un médicament",
        variant: "destructive",
      })
      return
    }

    const consultation = consultations.find((c) => c.id === consultationId)
    if (!consultation) return

    const hasExistingPrescription = Boolean(consultation.prescription)

    if (hasExistingPrescription && consultation.prescription?.id) {
      try {
        const lastResponse = await validLines.reduce<Promise<PrescriptionDTO>>(async (prevPromise, line) => {
          await prevPromise
          const med = medications.find((m) => m.id === Number(line.medicationId))
          const response = await prescriptionApi.addLine(consultation.prescription!.id!, {
            medicationId: Number(line.medicationId),
            dosage: line.posologie,
            durationDays: Number.parseInt(line.duree, 10) || 0,
            comment: line.commentaire,
            lineType: "MEDICATION",
            medicationName: med?.commercialName,
          })
          return response.data
        }, Promise.resolve(consultation.prescription))

        updateConsultationsState((prev) => prev.map((c) => (c.id === consultationId ? { ...c, prescription: lastResponse } : c)))
        setOrdonnanceDialogOpen(false)
        setSelectedMedications([])

        toast({
          title: "Ordonnance mise à jour",
          description: "Les lignes ont été ajoutées avec succès",
        })
      } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.response?.data?.message || "Impossible d'ajouter les lignes",
          variant: "destructive",
        })
      }
    } else {
      const payload = {
        consultationId,
        patientId,
        doctorId: medecinId,
        clinicId: (patient as Patient).cabinetId ?? 0,
        prescriptionDate: new Date().toISOString().split("T")[0],
        lines: validLines.map((line) => {
          const med = medications.find((m) => m.id === Number(line.medicationId))
          return {
            medicationId: Number(line.medicationId),
            dosage: line.posologie,
            durationDays: Number.parseInt(line.duree, 10) || 0,
            comment: line.commentaire,
            lineType: "MEDICATION",
            medicationName: med?.commercialName,
          }
        }),
      }

      try {
        const { data: created } = await prescriptionApi.create(payload)
        updateConsultationsState((prev) => prev.map((c) => (c.id === consultationId ? { ...c, prescription: created } : c)))
        setOrdonnanceDialogOpen(false)
        setSelectedMedications([])

        toast({
          title: "Ordonnance créée",
          description: "L'ordonnance a été enregistrée avec succès",
        })
      } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.response?.data?.message || "Impossible de créer l'ordonnance",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteConsultation = async (consultationId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette consultation ?")) return

    const previous = [...consultations]
    updateConsultationsState((prev) => prev.filter((c) => c.id !== consultationId))

    try {
      await deleteConsultationMutation.mutateAsync(consultationId)
      toast({
        title: "Consultation supprimée",
        description: "La consultation a été supprimée avec succès",
      })
    } catch (err: any) {
      updateConsultationsState(previous)
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Impossible de supprimer la consultation",
        variant: "destructive",
      })
    }
  }

  const handlePrintOrdonnance = (prescription: PrescriptionDTO) => {
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

  const updateMedication = (
    index: number,
    field: "medicationId" | "posologie" | "duree" | "commentaire",
    value: string | number,
  ) => {
    const updated = [...selectedMedications]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedMedications(updated)
  }

  const handleEditConsultation = (consultation: ConsultationViewModel) => {
    setIsEditMode(true)
    setEditConsultationId(String(consultation.id))
    setNewConsultation({
      dateConsultation: consultation.dateConsultation,
      type: consultation.type || "",
      diagnostic: consultation.diagnostic || "",
      traitement: consultation.traitement || "",
      observations: consultation.observations || "",
    })
    setConsultationDialogOpen(true)
  }

  const handleEndConsultation = async (consultation: ConsultationViewModel) => {
    if (!consultation.diagnostic || !consultation.traitement) {
      toast({
        title: "Erreur",
        description: "La consultation doit avoir un diagnostic et un traitement avant d'être clôturée",
        variant: "destructive",
      })
      return
    }

    const previous = [...consultations]
    const optimisticArchivedAt = new Date().toISOString()
    updateConsultationsState((prev) =>
      prev.map((c) =>
        c.id === consultation.id ? { ...c, status: "terminee", archived: true, archivedAt: optimisticArchivedAt } : c,
      ),
    )

    try {
      const patientRecord = patient as Patient
      const consultationDetails = consultation as Partial<ConsultationDTO>
      const resolvedMedecinId = consultationDetails.medecinId ?? medecinId
      const resolvedCabinetId = consultationDetails.cabinetId ?? patientRecord?.cabinetId
      const resolvedRendezVousId =
        consultationDetails.rendezVousId ?? todayRdv?.id ?? undefined

      const payload: Partial<ConsultationDTO> = {
        id: consultation.id,
        patientId: consultation.patientId ?? (patient as Patient).id,
        medecinId: consultation.medecinId ?? medecinId,
        cabinetId: consultation.cabinetId ?? (patient as Patient).cabinetId,
        rendezVousId: consultation.rendezVousId ?? todayRdv?.id ?? 0,
        type: consultation.type,
        dateConsultation: consultation.dateConsultation,
        diagnostic: consultation.diagnostic,
        traitement: consultation.traitement,
        observations: consultation.observations,
        examenClinique: consultation.examenClinique,
        examenSupplementaire: consultation.examenSupplementaire,
        archived: true,
        archivedAt: optimisticArchivedAt,
      }

      console.log("[consultation-update] Terminating consultation", consultation.id)
      console.log("[consultation-update] Payload:", JSON.stringify(payload, null, 2))
      const updated = await updateConsultationMutation.mutateAsync({ consultationId: consultation.id, payload })
      console.log("[consultation-update] received", updated)
      updateConsultationsState((prev) =>
        prev.map((c) => (c.id === consultation.id ? { ...c, ...updated, status: "terminee" } : c)),
      )

      // Success: Backend will handle appointment status update and secretary notification
      toast({
        title: "Consultation terminée",
        description: "Le rendez-vous a été marqué comme terminé et la secrétaire a été notifiée",
      })
    } catch (err: any) {
      updateConsultationsState(previous)
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Impossible de terminer la consultation",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {[patient.nom, patient.prenom]
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{patient.nom} {patient.prenom}</h1>
              <p className="text-muted-foreground">Dossier médical complet</p>
            </div>
          </div>
          <Badge className="bg-success/10 text-success border-success/20">
            Actif
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
                <p className="font-medium">{patient.dateNaissance}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 border border-success/20">
                <Phone className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="font-medium">{patient.numTel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 border border-info/20">
                <MapPin className="w-4 h-4 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adresse</p>
                <p className="font-medium">{patient.adresse?.rue} {patient.adresse?.ville}</p>
              </div>
            </div>
            {patient.typeMutuelle && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mutuelle</p>
                  <p className="font-medium">{patient.typeMutuelle}</p>
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
              Consultations ({consultations.length})
            </h2>
            <Dialog
              open={consultationDialogOpen}
              onOpenChange={(open) => {
                setConsultationDialogOpen(open)
                if (!open) {
                  setIsEditMode(false)
                  setEditConsultationId(null)
                  setNewConsultation({
                    dateConsultation: new Date().toISOString(),
                    type: "CONSULTATION",
                    diagnostic: "",
                    traitement: "",
                    observations: "",
                  })
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 glow-primary"
                  disabled={!hasEligibleRdv || todayRdvLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle consultation
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Modifier la Consultation" : "Nouvelle Consultation"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!hasEligibleRdv && !todayRdvLoading && (
                    <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Aucun rendez-vous valide trouvé pour aujourd'hui.
                    </div>
                  )}
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newConsultation.dateConsultation.split("T")[0]}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          dateConsultation: new Date(e.target.value).toISOString(),
                        })
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={newConsultation.type}
                      onValueChange={(value) => setNewConsultation({ ...newConsultation, type: value })}
                    >
                      <SelectTrigger id="type" className="bg-background/50">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSULTATION">CONSULTATION</SelectItem>
                        <SelectItem value="CONTROLE">CONTROLE</SelectItem>
                      </SelectContent>
                    </Select>
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
                      value={newConsultation.observations}
                      onChange={(e) => setNewConsultation({ ...newConsultation, observations: e.target.value })}
                      placeholder="Notes supplémentaires"
                      className="bg-background/50"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setConsultationDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      className="bg-primary hover:bg-primary/90 glow-primary"
                      disabled={!hasEligibleRdv || todayRdvLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle consultation
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="glass-card max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{isEditMode ? "Modifier la Consultation" : "Nouvelle Consultation"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!hasEligibleRdv && !todayRdvLoading && (
                      <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Aucun rendez-vous valide trouvé pour aujourd'hui.
                      </div>
                    )}
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newConsultation.dateConsultation.split("T")[0]}
                        onChange={(e) =>
                          setNewConsultation({
                            ...newConsultation,
                            dateConsultation: new Date(e.target.value).toISOString(),
                          })
                        }
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={newConsultation.type}
                        onValueChange={(value) => setNewConsultation({ ...newConsultation, type: value })}
                      >
                        <SelectTrigger id="type" className="bg-background/50">
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSULTATION">CONSULTATION</SelectItem>
                          <SelectItem value="CONTROLE">CONTROLE</SelectItem>
                        </SelectContent>
                      </Select>
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
                        value={newConsultation.observations}
                        onChange={(e) => setNewConsultation({ ...newConsultation, observations: e.target.value })}
                        placeholder="Notes supplémentaires"
                        className="bg-background/50"
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setConsultationDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={handleAddConsultation}
                        className="bg-primary hover:bg-primary/90"
                        disabled={createConsultationMutation.isPending}
                      >
                        {isEditMode ? "Mettre à jour" : "Enregistrer"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {consultations.length > 0 ? (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <Card
                  key={consultation.id}
                  className="bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/40 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {consultation.dateConsultation}
                        </Badge>
                        {(consultation.status === "terminee" || consultation.archived) && (
                          <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                            Terminée
                          </Badge>
                        )}
                        <h3 className="font-semibold">{consultation.type || "-"}</h3>
                      </div>
                      <div className="flex gap-2">
                        {!(consultation.status === "terminee" || consultation.archived) && (
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
                      {consultation.archivedAt && (
                        <p className="text-xs text-muted-foreground">Archivée le {consultation.archivedAt}</p>
                      )}
                      {consultation.traitement && (
                        <div>
                          <p className="text-muted-foreground">Traitement:</p>
                          <p>{consultation.traitement}</p>
                        </div>
                      )}
                      {consultation.observations && (
                        <div>
                          <p className="text-muted-foreground">Notes:</p>
                          <p className="text-muted-foreground text-xs">{consultation.observations}</p>
                        </div>
                      )}
                    </div>

                    {/* Ordonnance */}
                    {consultation.prescription ? (
                      <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Pill className="w-4 h-4 text-primary" />
                            Ordonnance
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintOrdonnance(consultation.prescription!)}
                            className="gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimer
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {consultation.prescription.lines.map((line, idx) => {
                            const med = medications.find((m) => m.id === line.medicationId)
                            return (
                              <div key={idx} className="text-sm p-2 rounded bg-background/50">
                                <p className="font-medium">
                                  {med?.commercialName || line.medicationName || "Médicament"}
                                  {med?.dosage ? ` - ${med.dosage}` : ""}
                                  {med?.form ? ` (${med.form})` : ""}
                                </p>
                                <p className="text-muted-foreground text-xs">{line.dosage}</p>
                                <p className="text-muted-foreground text-xs">Durée: {line.durationDays} jours</p>
                                {line.comment && <p className="text-muted-foreground text-xs">{line.comment}</p>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <Dialog
                        open={ordonnanceDialogOpen && editConsultationId === String(consultation.id)}
                        onOpenChange={(open) => {
                          setOrdonnanceDialogOpen(open)
                          if (open) setEditConsultationId(String(consultation.id))
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 bg-transparent"
                            onClick={() => setEditConsultationId(String(consultation.id))}
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
                                    value={med.medicationId === "" ? "" : String(med.medicationId)}
                                    onValueChange={(value) => updateMedication(index, "medicationId", Number(value))}
                                  >
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Sélectionner un médicament" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {medicationsLoading && <SelectItem value="" disabled>Chargement...</SelectItem>}
                                      {!medicationsLoading && medications.length === 0 && (
                                        <SelectItem value="" disabled>Aucun médicament disponible</SelectItem>
                                      )}
                                      {medications.map((medication) => (
                                        <SelectItem key={medication.id} value={String(medication.id)}>
                                          {medication.commercialName} - {medication.dosage} ({medication.form})
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
                    {!(consultation.status === "terminee" || consultation.archived) && (
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
