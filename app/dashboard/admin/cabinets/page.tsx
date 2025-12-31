"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Building2,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Calendar,
  X,
  Search,
  CheckCircle2,
  Map,
  Grid3x3,
  Loader2,
  Power,
  PowerOff,
  Stethoscope,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { clinicApi, type ClinicDTO, type ClinicStatus } from "@/api/clinic.api"

export default function CabinetsPage() {
  const [clinics, setClinics] = useState<ClinicDTO[]>([])
  const [selectedClinic, setSelectedClinic] = useState<ClinicDTO | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"map" | "grid">("map")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    phone: "",
    address: "",
    logoUrl: "",
    status: "ACTIVE" as ClinicStatus,
    serviceEndDate: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch clinics on mount
  useEffect(() => {
    fetchClinics()
  }, [])

  const fetchClinics = async () => {
    try {
      setIsLoading(true)
      const response = await clinicApi.getAll()
      setClinics(response.data)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les cabinets",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClinics = clinics.filter(
    (clinic) =>
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    console.log("Validating form data:", formData)
    if (!formData.name.trim()) newErrors.name = "Le nom du cabinet est requis"
    if (!formData.specialty.trim()) newErrors.specialty = "La spécialité est requise"
    if (!formData.address.trim()) newErrors.address = "L'adresse est requise"
    if (!formData.phone.trim()) newErrors.phone = "Le téléphone est requis"
    if (!formData.serviceEndDate) newErrors.serviceEndDate = "La date de fin de service est requise"

    console.log("Validation errors:", newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = () => {
    setDialogMode("create")
    setFormData({
      name: "",
      specialty: "",
      phone: "",
      address: "",
      logoUrl: "",
      status: "ACTIVE",
      serviceEndDate: "",
    })
    setErrors({})
    setShowDialog(true)
  }

  const handleEdit = (clinic: ClinicDTO) => {
    console.log("Editing clinic:", clinic)
    setDialogMode("edit")
    setSelectedClinic(clinic)
    setFormData({
      name: clinic.name,
      specialty: clinic.specialty,
      phone: clinic.phone,
      address: clinic.address,
      logoUrl: clinic.logoUrl || "",
      status: clinic.status || "ACTIVE",
      serviceEndDate: clinic.serviceEndDate || "",
    })
    setErrors({})
    setShowDialog(true)
  }

  const handleSave = async () => {
    console.log("handleSave called, dialogMode:", dialogMode)
    if (!validateForm()) {
      console.log("Validation failed, stopping")
      return
    }
    console.log("Validation passed, proceeding...")
    console.log("selectedClinic:", selectedClinic)
    console.log("selectedClinic.id:", selectedClinic?.id)

    try {
      if (dialogMode === "create") {
        const createData: any = {
          name: formData.name.trim(),
          specialty: formData.specialty.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          status: formData.status,
          serviceEndDate: formData.serviceEndDate,
        }
        if (formData.logoUrl.trim()) {
          createData.logoUrl = formData.logoUrl.trim()
        }
        console.log("Creating clinic with data:", createData)
        const response = await clinicApi.create(createData)
        setClinics([...clinics, response.data])
        toast({ title: "Succès", description: "Cabinet créé avec succès" })
      } else if (selectedClinic?.id) {
        const updateData: any = {
          name: formData.name.trim(),
          specialty: formData.specialty.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          status: formData.status,
          serviceEndDate: formData.serviceEndDate,
        }
        if (formData.logoUrl.trim()) {
          updateData.logoUrl = formData.logoUrl.trim()
        }
        console.log("Updating clinic ID:", selectedClinic.id, "with data:", updateData)
        const response = await clinicApi.update(selectedClinic.id, updateData)
        console.log("Update response:", response.data)
        setClinics(clinics.map((c) => (c.id === selectedClinic.id ? response.data : c)))
        toast({ title: "Succès", description: "Cabinet mis à jour avec succès" })
      }
      setShowDialog(false)
    } catch (error: any) {
      console.error("Error saving clinic:", error)
      console.error("Error response:", error?.response?.data)
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || (dialogMode === "create" ? "Impossible de créer le cabinet" : "Impossible de mettre à jour le cabinet"),
        variant: "destructive",
      })
    }
  }

  const handleActivate = async (clinic: ClinicDTO) => {
    if (!clinic.id) return
    try {
      const response = await clinicApi.activate(clinic.id)
      setClinics(clinics.map((c) => (c.id === clinic.id ? response.data : c)))
      toast({ title: "Succès", description: `${clinic.name} a été activé` })
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'activer le cabinet", variant: "destructive" })
    }
  }

  const handleDeactivate = async (clinic: ClinicDTO) => {
    if (!clinic.id) return
    try {
      const response = await clinicApi.deactivate(clinic.id)
      setClinics(clinics.map((c) => (c.id === clinic.id ? response.data : c)))
      toast({ title: "Succès", description: `${clinic.name} a été désactivé` })
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de désactiver le cabinet", variant: "destructive" })
    }
  }

  const handleViewDetails = (clinic: ClinicDTO) => {
    setSelectedClinic(clinic)
    setShowDetailsDialog(true)
  }

  const getStatusColor = (status: ClinicStatus) => {
    switch (status) {
      case "ACTIVE":
        return "border-success text-success"
      case "INACTIVE":
        return "border-destructive text-destructive"
      case "SUSPENDED":
        return "border-warning text-warning"
      default:
        return "border-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: ClinicStatus) => {
    switch (status) {
      case "ACTIVE":
        return "Actif"
      case "INACTIVE":
        return "Inactif"
      case "SUSPENDED":
        return "Suspendu"
      default:
        return status
    }
  }

  const stats = [
    { label: "Total Cabinets", value: clinics.length, icon: Building2 },
    { label: "Cabinets Actifs", value: clinics.filter((c) => c.status === "ACTIVE").length, icon: CheckCircle2 },
    { label: "Spécialités", value: [...new Set(clinics.map((c) => c.specialty))].length, icon: Stethoscope },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cartographie des Cabinets</h1>
            <p className="text-muted-foreground">Visualisez et gérez tous les cabinets médicaux et leurs équipes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 glass-card rounded-lg">
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="gap-2"
              >
                <Map className="w-4 h-4" />
                Carte
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Grille
              </Button>
            </div>
            <Button onClick={handleCreate} className="gap-2 glow-primary">
              <Plus className="w-4 h-4" />
              Nouveau Cabinet
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="glass-card p-6 hover:scale-105 transition-all duration-300 glow-primary animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un cabinet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-card"
          />
        </div>

        {viewMode === "map" ? (
          <div className="relative glass-card p-8 rounded-2xl border-2 border-primary/20 overflow-hidden min-h-[600px]">
            {/* Map background grid pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="h-full w-full"
                style={{ backgroundImage: "var(--grid-pattern)", backgroundSize: "30px 30px" }}
              />
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Chargement des cabinets...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Map markers for clinics */}
                <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
                  {filteredClinics.map((clinic, index) => {
                    const isActive = clinic.status === "ACTIVE"

                    return (
                      <div
                        key={clinic.id ?? `clinic-${index}`}
                        className={`relative group cursor-pointer animate-fade-in-up`}
                        style={{ animationDelay: `${index * 150}ms` }}
                        onClick={() => handleViewDetails(clinic)}
                      >
                        {/* Connection lines visual effect */}
                        <div className="absolute inset-0 -z-10">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-radial from-primary/30 to-transparent" />
                          </div>
                        </div>

                        {/* Clinic marker card */}
                        <Card
                          className={`glass-card p-6 hover:scale-105 transition-all duration-300 border-2 ${
                            isActive ? "border-primary/30 glow-primary" : "border-border/30"
                          }`}
                        >
                          {/* Clinic Icon with pulse animation */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="relative">
                              <div
                                className={`p-4 rounded-2xl bg-gradient-to-br ${
                                  isActive
                                    ? "from-primary/20 to-primary/5 border-2 border-primary/30"
                                    : "from-muted/20 to-muted/5 border-2 border-muted/30"
                                }`}
                              >
                                <Building2 className={`w-8 h-8 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              {isActive && (
                                <div className="absolute -top-1 -right-1">
                                  <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg truncate">{clinic.name}</h3>
                              <Badge variant="outline" className={getStatusColor(clinic.status)}>
                                {getStatusLabel(clinic.status)}
                              </Badge>
                            </div>

                            {/* Edit/Activate buttons */}
                            <div
                              className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(clinic)} className="h-8 w-8">
                                <Edit className="w-3 h-3" />
                              </Button>
                              {clinic.status === "ACTIVE" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeactivate(clinic)}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                >
                                  <PowerOff className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleActivate(clinic)}
                                  className="h-8 w-8 text-success hover:bg-success/10"
                                >
                                  <Power className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Location info */}
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Stethoscope className="w-4 h-4 text-primary" />
                              <span className="font-medium">{clinic.specialty}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{clinic.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{clinic.phone}</span>
                            </div>
                          </div>

                          {/* Service end date */}
                          <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border/50">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Fin de service: {new Date(clinic.serviceEndDate).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </Card>
                      </div>
                    )
                  })}
                </div>

                {filteredClinics.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun cabinet trouvé</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Grid view (existing layout)
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <Card className="glass-card p-12 col-span-full">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Chargement des cabinets...</p>
                </div>
              </Card>
            ) : (
              filteredClinics.map((clinic, index) => (
                <Card
                  key={clinic.id ?? `clinic-grid-${index}`}
                  className="glass-card p-6 hover:scale-105 transition-all duration-300 cursor-pointer glow-primary group"
                  onClick={() => handleViewDetails(clinic)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{clinic.name}</h3>
                        <Badge variant="outline" className={getStatusColor(clinic.status)}>
                          {getStatusLabel(clinic.status)}
                        </Badge>
                      </div>
                    </div>
                    <div
                      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(clinic)} className="h-8 w-8">
                        <Edit className="w-3 h-3" />
                      </Button>
                      {clinic.status === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivate(clinic)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <PowerOff className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActivate(clinic)}
                          className="h-8 w-8 text-success hover:bg-success/10"
                        >
                          <Power className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Stethoscope className="w-4 h-4" />
                      <span>{clinic.specialty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{clinic.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{clinic.phone}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(clinic.serviceEndDate).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {showDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {dialogMode === "create" ? "Nouveau Cabinet" : "Modifier Cabinet"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du Cabinet *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">Spécialité *</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="Ex: Médecine générale, Cardiologie..."
                      className={errors.specialty ? "border-destructive" : ""}
                    />
                    {errors.specialty && <p className="text-xs text-destructive">{errors.specialty}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={errors.address ? "border-destructive" : ""}
                  />
                  {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL du Logo</Label>
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ClinicStatus })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="ACTIVE">Actif</option>
                      <option value="INACTIVE">Inactif</option>
                      <option value="SUSPENDED">Suspendu</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceEndDate">Date de fin de service *</Label>
                    <Input
                      id="serviceEndDate"
                      type="date"
                      value={formData.serviceEndDate}
                      onChange={(e) => setFormData({ ...formData, serviceEndDate: e.target.value })}
                      className={errors.serviceEndDate ? "border-destructive" : ""}
                    />
                    {errors.serviceEndDate && (
                      <p className="text-xs text-destructive">{errors.serviceEndDate}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} className="glow-primary">
                  {dialogMode === "create" ? "Créer" : "Mettre à jour"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {showDetailsDialog && selectedClinic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedClinic.name}</h2>
                  <Badge variant="outline" className={getStatusColor(selectedClinic.status)}>
                    {getStatusLabel(selectedClinic.status)}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowDetailsDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-4 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Spécialité</Label>
                    <p className="text-sm font-medium">{selectedClinic.specialty}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Téléphone</Label>
                    <p className="text-sm">{selectedClinic.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Adresse</Label>
                    <p className="text-sm">{selectedClinic.address}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Date de fin de service</Label>
                    <p className="text-sm">{new Date(selectedClinic.serviceEndDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Fermer
                </Button>
                <Button onClick={() => { setShowDetailsDialog(false); handleEdit(selectedClinic); }} className="glow-primary">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
