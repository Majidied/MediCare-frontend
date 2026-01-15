"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Pill, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type MedicationDTO } from "@/api/medication.api"
import { validateRequired, validateDosage, sanitizeInput } from "@/lib/validation.utils"
import { useMedications, useCreateMedication, useUpdateMedication, useDeleteMedication } from "@/hooks/use-medication"

// Form component moved outside to prevent recreation on every render
const MedicationForm = ({
  formData,
  setFormData,
  errors,
  onSubmit,
  submitLabel,
}: {
  formData: { name: string; dosage: string; form: string; description: string }
  setFormData: (data: { name: string; dosage: string; form: string; description: string }) => void
  errors: Record<string, string>
  onSubmit: () => void
  submitLabel: string
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">
        Nom du médicament <span className="text-destructive">*</span>
      </Label>
      <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Ex: Paracétamol"
        className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {errors.name && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.name}
        </p>
      )}
    </div>

    <div className="space-y-2">
      <Label htmlFor="dosage">
        Dosage <span className="text-destructive">*</span>
      </Label>
      <Input
        id="dosage"
        value={formData.dosage}
        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
        placeholder="Ex: 500mg, 10ml"
        className={errors.dosage ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {errors.dosage && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.dosage}
        </p>
      )}
    </div>

    <div className="space-y-2">
      <Label htmlFor="form">
        Forme <span className="text-destructive">*</span>
      </Label>
      <Input
        id="form"
        value={formData.form}
        onChange={(e) => setFormData({ ...formData, form: e.target.value })}
        placeholder="Ex: Comprimé, Sirop, Gélule"
        className={errors.form ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {errors.form && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.form}
        </p>
      )}
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <textarea
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description optionnelle du médicament"
        className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>

    <div className="flex gap-3 pt-4">
      <Button onClick={onSubmit} className="flex-1 glow-primary">
        {submitLabel}
      </Button>
    </div>
  </div>
)

export default function MedicationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<MedicationDTO | null>(null)
  const { toast } = useToast()

  // Use React Query hooks
  const { data: medications = [], isLoading } = useMedications()
  const createMutation = useCreateMedication()
  const updateMutation = useUpdateMedication()
  const deleteMutation = useDeleteMedication()

  // Form state
  const [formData, setFormData] = useState({
    commercialName: "",
    dci: "",
    dosage: "",
    form: "",
  })

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate commercial name
    const nameValidation = validateRequired(formData.commercialName, "Le nom commercial", 2, 100)
    if (!nameValidation.valid) newErrors.commercialName = nameValidation.error!

    // Validate DCI
    const dciValidation = validateRequired(formData.dci, "La DCI", 2, 100)
    if (!dciValidation.valid) newErrors.dci = dciValidation.error!

    // Validate dosage with specific format
    const dosageValidation = validateDosage(formData.dosage)
    if (!dosageValidation.valid) newErrors.dosage = dosageValidation.error!

    // Validate form (pharmaceutical form)
    const formValidation = validateRequired(formData.form, "La forme pharmaceutique", 2, 50)
    if (!formValidation.valid) newErrors.form = formValidation.error!

    // Check for duplicate medication name (except when editing)
    const isDuplicate = medications.some(
      (med) =>
        med.commercialName.toLowerCase() === sanitizeInput(formData.commercialName).toLowerCase() &&
        (!editingMedication || med.id !== editingMedication.id),
    )

    if (isDuplicate) {
      newErrors.commercialName = "Ce médicament existe déjà"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      commercialName: "",
      dci: "",
      dosage: "",
      form: "",
    })
    setErrors({})
    setEditingMedication(null)
  }

  // Create medication
  const handleCreate = async () => {
    if (!validateForm()) return

    createMutation.mutate(
      {
        commercialName: formData.commercialName.trim(),
        dci: formData.dci.trim(),
        dosage: formData.dosage.trim(),
        form: formData.form.trim(),
      },
      {
        onSuccess: (response) => {
          setIsCreateOpen(false)
          resetForm()
          toast({
            title: "Médicament créé",
            description: `${response.data.commercialName} a été ajouté avec succès`,
          })
        },
        onError: () => {
          toast({
            title: "Erreur",
            description: "Impossible de créer le médicament",
            variant: "destructive",
          })
        },
      }
    )
  }

  // Edit medication
  const handleEdit = (medication: MedicationDTO) => {
    setEditingMedication(medication)
    setFormData({
      commercialName: medication.commercialName,
      dci: medication.dci,
      dosage: medication.dosage,
      form: medication.form,
    })
    setErrors({})
    setIsEditOpen(true)
  }

  // Update medication
  const handleUpdate = async () => {
    if (!validateForm() || !editingMedication || !editingMedication.id) return

    updateMutation.mutate(
      {
        id: editingMedication.id,
        data: {
          commercialName: formData.commercialName.trim(),
          dci: formData.dci.trim(),
          dosage: formData.dosage.trim(),
          form: formData.form.trim(),
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false)
          resetForm()
          toast({
            title: "Médicament modifié",
            description: "Les informations ont été mises à jour avec succès",
          })
        },
        onError: () => {
          toast({
            title: "Erreur",
            description: "Impossible de modifier le médicament",
            variant: "destructive",
          })
        },
      }
    )
  }

  // Delete medication
  const handleDelete = async (id: number) => {
    const medication = medications.find((m) => m.id === id)
    
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Médicament supprimé",
          description: `${medication?.commercialName} a été supprimé`,
          variant: "destructive",
        })
      },
      onError: () => {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le médicament",
          variant: "destructive",
        })
      },
    })
  }

  // Filter medications
  const filteredMedications = medications.filter(
    (medication) =>
      medication.commercialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medication.dci.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medication.form.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medication.dosage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des médicaments</h1>
            <p className="text-muted-foreground mt-1">Gérez le référentiel des médicaments</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="glow-primary" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un médicament
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-xl">Nouveau médicament</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-commercialName">
                    Nom commercial <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="create-commercialName"
                    value={formData.commercialName}
                    onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                    placeholder="Ex: Doliprane"
                    className={errors.commercialName ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.commercialName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.commercialName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-dci">
                    DCI (Dénomination Commune Internationale) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="create-dci"
                    value={formData.dci}
                    onChange={(e) => setFormData({ ...formData, dci: e.target.value })}
                    placeholder="Ex: Paracetamol"
                    className={errors.dci ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.dci && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.dci}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-dosage">
                    Dosage <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="create-dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="Ex: 500 mg, 10 ml"
                    className={errors.dosage ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.dosage && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.dosage}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-form">
                    Forme <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="create-form"
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    placeholder="Ex: Comprimé, Sirop, Gélule"
                    className={errors.form ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.form && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.form}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleCreate} className="flex-1 glow-primary">
                    Créer le médicament
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total médicaments</p>
                <p className="text-2xl font-bold">{medications.length}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <Pill className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comprimés</p>
                <p className="text-2xl font-bold">
                  {medications.filter((m) => m.form.toLowerCase().includes("comprimé")).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/10 border border-info/20">
                <Pill className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Autres formes</p>
                <p className="text-2xl font-bold">
                  {medications.filter((m) => !m.form.toLowerCase().includes("comprimé")).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un médicament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-card border-primary/20"
          />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <Card className="glass-card border-primary/20 p-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Chargement...</h3>
              <p className="text-muted-foreground">Récupération des médicaments</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Medications List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMedications.map((medication) => (
                <Card
                  key={medication.id}
                  className="glass-card border-primary/20 p-6 hover:border-primary/40 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{medication.commercialName}</h3>
                        <p className="text-sm text-muted-foreground">{medication.dci}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {medication.dosage}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {medication.form}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Pill className="w-4 h-4 text-primary" />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 hover:bg-primary/5"
                        onClick={() => handleEdit(medication)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => medication.id && handleDelete(medication.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredMedications.length === 0 && (
              <Card className="glass-card border-primary/20 p-12">
                <div className="text-center">
                  <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun médicament trouvé</h3>
                  <p className="text-muted-foreground">Essayez de modifier votre recherche</p>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="glass-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-xl">Modifier le médicament</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-commercialName">
                  Nom commercial <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-commercialName"
                  value={formData.commercialName}
                  onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                  placeholder="Ex: Doliprane"
                  className={errors.commercialName ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.commercialName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.commercialName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dci">
                  DCI (Dénomination Commune Internationale) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-dci"
                  value={formData.dci}
                  onChange={(e) => setFormData({ ...formData, dci: e.target.value })}
                  placeholder="Ex: Paracetamol"
                  className={errors.dci ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.dci && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dci}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dosage">
                  Dosage <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="Ex: 500 mg, 10 ml"
                  className={errors.dosage ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.dosage && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dosage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-form">
                  Forme <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-form"
                  value={formData.form}
                  onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                  placeholder="Ex: Comprimé, Sirop, Gélule"
                  className={errors.form ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.form && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.form}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleUpdate} className="flex-1 glow-primary">
                  Mettre à jour
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
