"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Pill, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Medication } from "@/lib/mock-data"
import { MOCK_MEDICATIONS } from "@/lib/mock-data"

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
  const [medications, setMedications] = useState<Medication[]>(MOCK_MEDICATIONS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    form: "",
    description: "",
  })

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du médicament est obligatoire"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères"
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = "Le dosage est obligatoire"
    }

    if (!formData.form.trim()) {
      newErrors.form = "La forme est obligatoire"
    }

    // Check for duplicate medication name (except when editing)
    const isDuplicate = medications.some(
      (med) =>
        med.name.toLowerCase() === formData.name.toLowerCase().trim() &&
        (!editingMedication || med.id !== editingMedication.id),
    )

    if (isDuplicate) {
      newErrors.name = "Ce médicament existe déjà"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      form: "",
      description: "",
    })
    setErrors({})
    setEditingMedication(null)
  }

  // Create medication
  const handleCreate = () => {
    if (!validateForm()) return

    const newMedication: Medication = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      dosage: formData.dosage.trim(),
      form: formData.form.trim(),
      description: formData.description.trim(),
    }

    setMedications([...medications, newMedication])
    setIsCreateOpen(false)
    resetForm()
    toast({
      title: "Médicament créé",
      description: `${newMedication.name} a été ajouté avec succès`,
    })
  }

  // Edit medication
  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication)
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      form: medication.form,
      description: medication.description || "",
    })
    setErrors({})
    setIsEditOpen(true)
  }

  // Update medication
  const handleUpdate = () => {
    if (!validateForm() || !editingMedication) return

    setMedications(
      medications.map((med) =>
        med.id === editingMedication.id
          ? {
            ...med,
            name: formData.name.trim(),
            dosage: formData.dosage.trim(),
            form: formData.form.trim(),
            description: formData.description.trim(),
          }
          : med,
      ),
    )

    setIsEditOpen(false)
    resetForm()
    toast({
      title: "Médicament modifié",
      description: "Les informations ont été mises à jour avec succès",
    })
  }

  // Delete medication
  const handleDelete = (id: string) => {
    const medication = medications.find((m) => m.id === id)
    setMedications(medications.filter((m) => m.id !== id))
    toast({
      title: "Médicament supprimé",
      description: `${medication?.name} a été supprimé`,
      variant: "destructive",
    })
  }

  // Filter medications
  const filteredMedications = medications.filter(
    (medication) =>
      medication.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <MedicationForm formData={formData} setFormData={setFormData} errors={errors} onSubmit={handleCreate} submitLabel="Créer le médicament" />
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
                    <h3 className="font-semibold text-lg">{medication.name}</h3>
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

                {medication.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{medication.description}</p>
                )}

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
                    onClick={() => handleDelete(medication.id)}
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

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="glass-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-xl">Modifier le médicament</DialogTitle>
            </DialogHeader>
            <MedicationForm formData={formData} setFormData={setFormData} errors={errors} onSubmit={handleUpdate} submitLabel="Mettre à jour" />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
