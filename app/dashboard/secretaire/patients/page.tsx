"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Edit2, Trash2, FileText, Calendar, AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from "@/hooks/use-patient"
import { Patient, CreatePatientDTO } from "@/api/patient.api"
import { useToast } from "@/hooks/use-toast"

// Move PatientForm outside to prevent recreation on every render
const PatientForm = ({
  formData,
  setFormData,
  errors,
}: {
  formData: CreatePatientDTO
  setFormData: (data: CreatePatientDTO) => void
  errors: Record<string, string>
}) => (
  <div className="space-y-4 py-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Nom *</Label>
        <Input value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className={errors.nom ? "border-destructive" : ""} />
        {errors.nom && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.nom}</p>}
      </div>
      <div className="space-y-2">
        <Label>Prénom *</Label>
        <Input value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className={errors.prenom ? "border-destructive" : ""} />
        {errors.prenom && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.prenom}</p>}
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>CIN *</Label>
        <Input value={formData.cin} onChange={(e) => setFormData({ ...formData, cin: e.target.value })} className={errors.cin ? "border-destructive" : ""} />
        {errors.cin && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cin}</p>}
      </div>
      <div className="space-y-2">
        <Label>Date de naissance *</Label>
        <Input type="date" value={formData.dateNaissance} onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })} className={errors.dateNaissance ? "border-destructive" : ""} />
        {errors.dateNaissance && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.dateNaissance}</p>}
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Téléphone *</Label>
        <Input value={formData.numTel} onChange={(e) => setFormData({ ...formData, numTel: e.target.value })} placeholder="+212 6 12 34 56 78" className={errors.numTel ? "border-destructive" : ""} />
        {errors.numTel && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.numTel}</p>}
      </div>
      <div className="space-y-2">
        <Label>Mutuelle</Label>
        <select
          value={formData.typeMutuelle || "AUCUNE"}
          onChange={(e) => setFormData({ ...formData, typeMutuelle: e.target.value as "CNSS" | "CNOPS" | "PRIVEE" | "AUCUNE" })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="AUCUNE">Aucune</option>
          <option value="CNSS">CNSS</option>
          <option value="CNOPS">CNOPS</option>
          <option value="PRIVEE">Privée</option>
        </select>
      </div>
    </div>
  </div>
)

export default function SecretairePatientsPage() {
  // React Query hooks
  const { data: patients = [], isLoading: loading } = usePatients()
  const createMutation = useCreatePatient()
  const updateMutation = useUpdatePatient()
  const deleteMutation = useDeletePatient()

  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<CreatePatientDTO>({
    nom: "",
    prenom: "",
    cin: "",
    dateNaissance: "",
    numTel: "",
    adresse: { rue: "", ville: "" },
    typeMutuelle: "AUCUNE",
    sexe: "MASCULIN",
    cabinetId: 1,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredPatients = patients.filter(
    (patient) =>
      `${patient.nom} ${patient.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.cin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.numTel.includes(searchQuery) ||
      patient.typeMutuelle?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      cin: "",
      dateNaissance: "",
      numTel: "",
      adresse: { rue: "", ville: "" },
      typeMutuelle: "AUCUNE",
      sexe: "MASCULIN",
      cabinetId: 1,
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire"
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire"
    if (!formData.cin.trim()) newErrors.cin = "Le CIN est obligatoire"
    if (!formData.dateNaissance) newErrors.dateNaissance = "La date de naissance est obligatoire"
    if (!formData.numTel.trim()) newErrors.numTel = "Le téléphone est obligatoire"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = () => {
    if (!validateForm()) return
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false)
        resetForm()
        toast({ title: "Patient créé", description: `${formData.nom} ${formData.prenom} a été ajouté.` })
      },
      onError: () => toast({ title: "Erreur", description: "Échec de la création", variant: "destructive" }),
    })
  }

  const handleEdit = () => {
    if (!validateForm() || !selectedPatient) return
    updateMutation.mutate(
      { id: selectedPatient.id, data: formData },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false)
          setSelectedPatient(null)
          resetForm()
          toast({ title: "Patient modifié", description: `${formData.nom} ${formData.prenom} a été mis à jour.` })
        },
        onError: () => toast({ title: "Erreur", description: "Échec de la mise à jour", variant: "destructive" }),
      }
    )
  }

  const handleDelete = (patient: Patient) => {
    if (confirm(`Supprimer ${patient.nom} ${patient.prenom} ?`)) {
      deleteMutation.mutate(patient.id, {
        onSuccess: () => toast({ title: "Patient supprimé", variant: "destructive" }),
        onError: () => toast({ title: "Erreur", description: "Échec de la suppression", variant: "destructive" }),
      })
    }
  }

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData({
      nom: patient.nom,
      prenom: patient.prenom,
      cin: patient.cin,
      dateNaissance: patient.dateNaissance,
      numTel: patient.numTel,
      adresse: patient.adresse || { rue: "", ville: "" },
      typeMutuelle: patient.typeMutuelle || "AUCUNE",
      sexe: patient.sexe,
      cabinetId: patient.cabinetId,
    })
    setErrors({})
    setIsEditDialogOpen(true)
  }



  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Chargement...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Patients</h1>
              <p className="text-muted-foreground">Créez et gérez les dossiers patients</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 glow-primary" onClick={resetForm}>
                  <Plus className="w-4 h-4" /> Nouveau Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau patient</DialogTitle>
                </DialogHeader>
                <PatientForm formData={formData} setFormData={setFormData} errors={errors} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Créer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                  <h3 className="text-2xl font-bold mt-2">{patients.length}</h3>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patients Actifs</p>
                  <h3 className="text-2xl font-bold mt-2">{patients.length}</h3>
                </div>
                <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                  <Calendar className="w-6 h-6 text-success" />
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nouveaux ce mois</p>
                  <h3 className="text-2xl font-bold mt-2">12</h3>
                </div>
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card className="glass-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher par nom, CIN, téléphone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-background/50" />
            </div>
          </Card>

          {/* Table */}
          <Card className="glass-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Patient</th>
                    <th className="text-left p-4 font-medium">CIN</th>
                    <th className="text-left p-4 font-medium">Téléphone</th>
                    <th className="text-left p-4 font-medium">Mutuelle</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-border/50 hover:bg-primary/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{patient.nom[0]}{patient.prenom[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium">{patient.nom} {patient.prenom}</p>
                            <p className="text-xs text-muted-foreground">{patient.dateNaissance}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{patient.cin}</td>
                      <td className="p-4 text-sm">{patient.numTel}</td>
                      <td className="p-4 text-sm">{patient.typeMutuelle || "-"}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(patient)} className="hover:bg-primary/10">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(patient)} className="hover:bg-destructive/10 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPatients.length === 0 && <div className="p-12 text-center text-muted-foreground">Aucun patient trouvé</div>}
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier le patient</DialogTitle>
              </DialogHeader>
              <PatientForm formData={formData} setFormData={setFormData} errors={errors} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Mettre à jour
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </DashboardLayout>
  )
}
