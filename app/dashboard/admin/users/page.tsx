"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Pencil, Trash2, Search, UserPlus, AlertCircle } from "lucide-react"
import type { User, UserRole } from "@/lib/mock-data"
import { MOCK_USERS } from "@/lib/mock-data"
import { toast } from "sonner"

type FormErrors = {
  name?: string
  email?: string
  password?: string
  role?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 6

const validateForm = (
  data: { name: string; email: string; password: string; role: string },
  isEdit = false,
): FormErrors => {
  const errors: FormErrors = {}

  if (!data.name.trim()) {
    errors.name = "Le nom est obligatoire"
  } else if (data.name.trim().length < 3) {
    errors.name = "Le nom doit contenir au moins 3 caractères"
  }

  if (!data.email.trim()) {
    errors.email = "L'email est obligatoire"
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = "Format d'email invalide"
  }

  if (!isEdit || data.password) {
    if (!data.password) {
      errors.password = "Le mot de passe est obligatoire"
    } else if (data.password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`
    }
  }

  if (!data.role) {
    errors.role = "Le rôle est obligatoire"
  }

  return errors
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "medecin" as UserRole,
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateUser = () => {
    const errors = validateForm(formData)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    // Check if email already exists
    if (users.some((u) => u.email === formData.email)) {
      setFormErrors({ ...errors, email: "Cet email est déjà utilisé" })
      toast.error("Cet email est déjà utilisé")
      return
    }

    const newUser: User = {
      id: Date.now().toString(),
      ...formData,
    }
    setUsers([...users, newUser])
    setIsCreateDialogOpen(false)
    setFormData({ name: "", email: "", password: "", role: "medecin" })
    setFormErrors({})
    toast.success("Utilisateur créé avec succès")
  }

  const handleEditUser = () => {
    if (!editingUser) return

    const errors = validateForm(formData, true)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    // Check if email already exists (excluding current user)
    if (users.some((u) => u.email === formData.email && u.id !== editingUser.id)) {
      setFormErrors({ ...errors, email: "Cet email est déjà utilisé" })
      toast.error("Cet email est déjà utilisé")
      return
    }

    setUsers(users.map((u) => (u.id === editingUser.id ? { ...editingUser, ...formData } : u)))
    setIsEditDialogOpen(false)
    setEditingUser(null)
    setFormData({ name: "", email: "", password: "", role: "medecin" })
    setFormErrors({})
    toast.success("Utilisateur modifié avec succès")
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId))
    toast.success("Utilisateur supprimé avec succès")
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "medecin":
        return "bg-primary/10 text-primary border-primary/20"
      case "secretaire":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Administrateur"
      case "medecin":
        return "Médecin"
      case "secretaire":
        return "Secrétaire"
    }
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "medecin" })
    setFormErrors({})
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground">Gérez les comptes du staff de la plateforme</p>
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 glow-primary">
                <UserPlus className="w-4 h-4" />
                Créer un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50 max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>Remplissez les informations pour créer un nouveau compte</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Dr. Marie Dupont"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined })
                    }}
                    className={`glass-card border-border/50 ${formErrors.name ? "border-destructive" : ""}`}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@cabinetx.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (formErrors.email) setFormErrors({ ...formErrors, email: undefined })
                    }}
                    className={`glass-card border-border/50 ${formErrors.email ? "border-destructive" : ""}`}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1">
                    Mot de passe <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      if (formErrors.password) setFormErrors({ ...formErrors, password: undefined })
                    }}
                    className={`glass-card border-border/50 ${formErrors.password ? "border-destructive" : ""}`}
                  />
                  {formErrors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.password}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Minimum {PASSWORD_MIN_LENGTH} caractères</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-1">
                    Rôle <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="glass-card border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medecin">Médecin</SelectItem>
                      <SelectItem value="secretaire">Secrétaire</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} className="w-full glow-primary">
                  Créer l'utilisateur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Médecins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{users.filter((u) => u.role === "medecin").length}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Secrétaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {users.filter((u) => u.role === "secretaire").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou rôle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Liste des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-border/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          className="hover:bg-primary/5"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                          className="hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setEditingUser(null)
              resetForm()
            }
          }}
        >
          <DialogContent className="glass-card border-border/50 max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>Modifiez les informations de l'utilisateur</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="flex items-center gap-1">
                  Nom complet <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  placeholder="Ex: Dr. Marie Dupont"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined })
                  }}
                  className={`glass-card border-border/50 ${formErrors.name ? "border-destructive" : ""}`}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="flex items-center gap-1">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email@cabinetx.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (formErrors.email) setFormErrors({ ...formErrors, email: undefined })
                  }}
                  className={`glass-card border-border/50 ${formErrors.email ? "border-destructive" : ""}`}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Mot de passe (optionnel)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (formErrors.password) setFormErrors({ ...formErrors, password: undefined })
                  }}
                  className={`glass-card border-border/50 ${formErrors.password ? "border-destructive" : ""}`}
                />
                {formErrors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.password}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Laissez vide pour conserver le mot de passe actuel</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role" className="flex items-center gap-1">
                  Rôle <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="glass-card border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medecin">Médecin</SelectItem>
                    <SelectItem value="secretaire">Secrétaire</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditUser} className="w-full glow-primary">
                Enregistrer les modifications
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
