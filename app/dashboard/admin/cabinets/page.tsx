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
  Mail,
  Calendar,
  X,
  Search,
  Crown,
  CheckCircle2,
  Map,
  Grid3x3,
  UserPlus,
  UserMinus,
} from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { MOCK_CABINETS, MOCK_USERS, type Cabinet, type User } from "@/lib/mock-data"

export default function CabinetsPage() {
  const [cabinets, setCabinets] = useState<Cabinet[]>(MOCK_CABINETS)
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showUsersDialog, setShowUsersDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"map" | "grid">("map")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    city: "",
    country: "Maroc",
    postalCode: "",
    status: "Actif" as "Actif" | "Inactif",
    subscriptionPlan: "Basic" as "Basic" | "Premium" | "Enterprise",
    subscriptionEndDate: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredCabinets = cabinets.filter(
    (cabinet) =>
      cabinet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cabinet.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cabinet.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getUsersForCabinet = (cabinetId: string): User[] => {
    return users.filter((user) => user.cabinetId === cabinetId)
  }

  const getAvailableUsers = (): User[] => {
    return users.filter((user) => user.role !== "admin" && !user.cabinetId)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Le nom du cabinet est requis"
    if (!formData.address.trim()) newErrors.address = "L'adresse est requise"
    if (!formData.phone.trim()) newErrors.phone = "Le téléphone est requis"
    if (!formData.email.trim()) newErrors.email = "L'email est requis"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide"
    }
    if (!formData.city.trim()) newErrors.city = "La ville est requise"
    if (!formData.postalCode.trim()) newErrors.postalCode = "Le code postal est requis"
    if (!formData.subscriptionEndDate) newErrors.subscriptionEndDate = "La date de fin d'abonnement est requise"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = () => {
    setDialogMode("create")
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      city: "",
      country: "Maroc",
      postalCode: "",
      status: "Actif",
      subscriptionPlan: "Basic",
      subscriptionEndDate: "",
    })
    setErrors({})
    setShowDialog(true)
  }

  const handleEdit = (cabinet: Cabinet) => {
    setDialogMode("edit")
    setSelectedCabinet(cabinet)
    setFormData({
      name: cabinet.name,
      address: cabinet.address,
      phone: cabinet.phone,
      email: cabinet.email,
      city: cabinet.city,
      country: cabinet.country,
      postalCode: cabinet.postalCode,
      status: cabinet.status,
      subscriptionPlan: cabinet.subscriptionPlan,
      subscriptionEndDate: cabinet.subscriptionEndDate,
    })
    setErrors({})
    setShowDialog(true)
  }

  const handleSave = () => {
    if (!validateForm()) return

    if (dialogMode === "create") {
      const newCabinet: Cabinet = {
        id: `cab${cabinets.length + 1}`,
        ...formData,
        userIds: [],
        createdAt: new Date().toISOString(),
      }
      setCabinets([...cabinets, newCabinet])
      toast({ title: "Succès", description: "Cabinet créé avec succès" })
    } else if (selectedCabinet) {
      setCabinets(cabinets.map((c) => (c.id === selectedCabinet.id ? { ...selectedCabinet, ...formData } : c)))
      toast({ title: "Succès", description: "Cabinet mis à jour avec succès" })
    }
    setShowDialog(false)
  }

  const handleDelete = (cabinet: Cabinet) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${cabinet.name} ?`)) {
      setCabinets(cabinets.filter((c) => c.id !== cabinet.id))
      // Also unassign users from this cabinet
      setUsers(users.map((user) => (user.cabinetId === cabinet.id ? { ...user, cabinetId: undefined } : user)))
      toast({ title: "Succès", description: "Cabinet supprimé avec succès" })
    }
  }

  const handleViewUsers = (cabinet: Cabinet) => {
    setSelectedCabinet(cabinet)
    setShowUsersDialog(true)
  }

  const handleAssignUser = (userId: string) => {
    if (!selectedCabinet) return
    setUsers(users.map((u) => (u.id === userId ? { ...u, cabinetId: selectedCabinet.id } : u)))
    toast({ title: "Succès", description: "Utilisateur assigné au cabinet" })
  }

  const handleUnassignUser = (userId: string) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, cabinetId: undefined } : u)))
    toast({ title: "Succès", description: "Utilisateur retiré du cabinet" })
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Basic":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Premium":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "Enterprise":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "medecin":
        return "bg-primary/10 text-primary border-primary/20"
      case "secretaire":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const stats = [
    { label: "Total Cabinets", value: cabinets.length, icon: Building2 },
    { label: "Cabinets Actifs", value: cabinets.filter((c) => c.status === "Actif").length, icon: CheckCircle2 },
    { label: "Total Utilisateurs", value: users.filter((u) => u.cabinetId).length, icon: Users },
    { label: "Premium +", value: cabinets.filter((c) => c.subscriptionPlan !== "Basic").length, icon: Crown },
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            {/* Map markers for cabinets */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
              {filteredCabinets.map((cabinet, index) => {
                const users = getUsersForCabinet(cabinet.id)
                const isActive = cabinet.status === "Actif"

                return (
                  <div
                    key={cabinet.id}
                    className={`relative group cursor-pointer animate-fade-in-up`}
                    style={{ animationDelay: `${index * 150}ms` }}
                    onClick={() => handleViewUsers(cabinet)}
                  >
                    {/* Connection lines visual effect */}
                    <div className="absolute inset-0 -z-10">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-radial from-primary/30 to-transparent" />
                      </div>
                    </div>

                    {/* Cabinet marker card */}
                    <Card
                      className={`glass-card p-6 hover:scale-105 transition-all duration-300 border-2 ${
                        isActive ? "border-primary/30 glow-primary" : "border-border/30"
                      }`}
                    >
                      {/* Cabinet Icon with pulse animation */}
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
                          <h3 className="font-bold text-lg truncate">{cabinet.name}</h3>
                          <Badge
                            variant="outline"
                            className={isActive ? "border-success text-success" : "border-destructive text-destructive"}
                          >
                            {cabinet.status}
                          </Badge>
                        </div>

                        {/* Edit/Delete buttons */}
                        <div
                          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(cabinet)} className="h-8 w-8">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cabinet)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Location info */}
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            {cabinet.city}, {cabinet.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{cabinet.phone}</span>
                        </div>
                      </div>

                      {/* Users count with avatars */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{users.length} membre(s)</span>
                        </div>
                        {users.length > 0 && (
                          <div className="flex -space-x-2">
                            {users.slice(0, 3).map((user) => (
                              <Avatar
                                key={user.id}
                                className="w-8 h-8 border-2 border-background ring-2 ring-primary/20"
                              >
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {users.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background ring-2 ring-primary/20 flex items-center justify-center">
                                <span className="text-xs text-primary font-bold">+{users.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Plan badge */}
                      <div className="mt-4 flex items-center gap-2">
                        <Badge variant="outline" className={getPlanColor(cabinet.subscriptionPlan)}>
                          {cabinet.subscriptionPlan}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Calendar className="w-3 h-3" />
                          {new Date(cabinet.subscriptionEndDate).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </Card>
                  </div>
                )
              })}
            </div>

            {filteredCabinets.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun cabinet trouvé</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Grid view (existing layout)
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCabinets.map((cabinet) => {
              const cabinetUsers = getUsersForCabinet(cabinet.id)
              return (
                <Card
                  key={cabinet.id}
                  className="glass-card p-6 hover:scale-105 transition-all duration-300 cursor-pointer glow-primary group"
                  onClick={() => handleViewUsers(cabinet)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{cabinet.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            cabinet.status === "Actif"
                              ? "border-success text-success"
                              : "border-destructive text-destructive"
                          }
                        >
                          {cabinet.status}
                        </Badge>
                      </div>
                    </div>
                    <div
                      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cabinet)} className="h-8 w-8">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cabinet)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {cabinet.city}, {cabinet.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{cabinet.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{cabinet.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{cabinetUsers.length} utilisateur(s)</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <Badge variant="outline" className={getPlanColor(cabinet.subscriptionPlan)}>
                      {cabinet.subscriptionPlan}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(cabinet.subscriptionEndDate).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </Card>
              )
            })}
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
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
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

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code Postal *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className={errors.postalCode ? "border-destructive" : ""}
                    />
                    {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
                  </div>

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
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "Actif" | "Inactif" })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan d'abonnement</Label>
                    <select
                      id="plan"
                      value={formData.subscriptionPlan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subscriptionPlan: e.target.value as "Basic" | "Premium" | "Enterprise",
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fin d'abonnement *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.subscriptionEndDate}
                      onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                      className={errors.subscriptionEndDate ? "border-destructive" : ""}
                    />
                    {errors.subscriptionEndDate && (
                      <p className="text-xs text-destructive">{errors.subscriptionEndDate}</p>
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

        {showUsersDialog && selectedCabinet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="glass-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCabinet.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCabinet.city}, {selectedCabinet.country}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignDialog(true)}
                    className="gap-2 glow-primary"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assigner
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowUsersDialog(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Adresse</Label>
                    <p className="text-sm">{selectedCabinet.address}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Téléphone</Label>
                    <p className="text-sm">{selectedCabinet.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-sm">{selectedCabinet.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Plan</Label>
                    <Badge className={getPlanColor(selectedCabinet.subscriptionPlan)}>
                      {selectedCabinet.subscriptionPlan}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Équipe du Cabinet ({getUsersForCabinet(selectedCabinet.id).length})
                </h3>

                <div className="space-y-3">
                  {getUsersForCabinet(selectedCabinet.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Aucun utilisateur assigné à ce cabinet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssignDialog(true)}
                        className="mt-4 gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Assigner des utilisateurs
                      </Button>
                    </div>
                  ) : (
                    getUsersForCabinet(selectedCabinet.id).map((user) => (
                      <Card key={user.id} className="glass-card p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {user.role === "medecin" ? "Médecin" : "Secrétaire"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnassignUser(user.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {showAssignDialog && selectedCabinet && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Assigner des utilisateurs</h2>
                  <p className="text-sm text-muted-foreground">Sélectionnez les utilisateurs à ajouter au cabinet</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAssignDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {getAvailableUsers().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Aucun utilisateur disponible</p>
                    <p className="text-sm mt-1">Tous les utilisateurs sont déjà assignés à un cabinet</p>
                  </div>
                ) : (
                  getAvailableUsers().map((user) => (
                    <Card key={user.id} className="glass-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          {user.role === "medecin" ? "Médecin" : "Secrétaire"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleAssignUser(user.id)} className="gap-2">
                          <UserPlus className="w-4 h-4" />
                          Assigner
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
