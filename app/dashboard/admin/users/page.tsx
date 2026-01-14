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
import { Pencil, Trash2, Search, UserPlus, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from "@/hooks/use-user"
import { useActiveClinics } from "@/hooks/use-clinic"
import type { UserDTO, UserRole, CreateUserRequest } from "@/api/user.api"
import { validateName, validateEmail, validatePhoneGeneral, validatePassword, PASSWORD_MIN_LENGTH } from "@/lib/validation.utils"
import { Combobox } from "@/components/ui/combobox"

type FormErrors = {
  firstName?: string
  lastName?: string
  login?: string
  phoneNumber?: string
  password?: string
  role?: string
  clinicId?: string
}

const validateForm = (
  data: { firstName: string; lastName: string; login: string; phoneNumber: string; password: string; role: string; clinicId: number | null },
  users: UserDTO[] = [],
  isEdit = false,
  editingUserId?: number
): FormErrors => {
  const errors: FormErrors = {}

  // Validate first name
  const firstNameValidation = validateName(data.firstName, "prénom")
  if (!firstNameValidation.valid) errors.firstName = firstNameValidation.error!

  // Validate last name
  const lastNameValidation = validateName(data.lastName, "nom")
  if (!lastNameValidation.valid) errors.lastName = lastNameValidation.error!

  // Validate email
  const emailValidation = validateEmail(data.login)
  if (!emailValidation.valid) errors.login = emailValidation.error!

  // Validate phone number
  const phoneValidation = validatePhoneGeneral(data.phoneNumber)
  if (!phoneValidation.valid) errors.phoneNumber = phoneValidation.error!

  // Validate password (only if not editing or if password is provided)
  if (!isEdit || data.password) {
    const passwordValidation = validatePassword(data.password, 'medium')
    if (!passwordValidation.valid) errors.password = passwordValidation.error!
  }

  if (!data.role) {
    errors.role = "Le rôle est obligatoire"
  }

  // Validate clinic for MEDCIN and SECRETAIRE roles
  if ((data.role === "MEDCIN" || data.role === "SECRETAIRE") && !data.clinicId) {
    errors.clinicId = "La clinique est obligatoire pour ce rôle"
  }

  // Validate that clinic doesn't already have a doctor/secretary
  if (data.clinicId && (data.role === "MEDCIN" || data.role === "SECRETAIRE")) {
    const existingUsersInClinic = users.filter(user => 
      user.clinicId === data.clinicId && 
      user.role === data.role &&
      user.active &&
      (!isEdit || user.id !== editingUserId)
    )
    
    if (existingUsersInClinic.length > 0) {
      if (data.role === "MEDCIN") {
        errors.clinicId = "Cette clinique a déjà un médecin assigné"
      } else if (data.role === "SECRETAIRE") {
        errors.clinicId = "Cette clinique a déjà une secrétaire assignée"
      }
    }
  }

  return errors
}

export default function UsersPage() {
  const { data: users = [], isLoading, isError } = useUsers()
  const { data: activeClinics = [] } = useActiveClinics()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deactivateUserMutation = useDeactivateUser()

  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null)

  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    login: "",
    phoneNumber: "",
    password: "",
    role: "MEDCIN" as UserRole,
    clinicId: null as number | null,
  })

  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Helper to update form data without causing re-render issues
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field as keyof FormErrors]) {
      const newErrors = { ...formErrors }
      delete newErrors[field as keyof FormErrors]
      setFormErrors(newErrors)
    }
  }

  const handleCreateUser = async () => {
    const errors = validateForm(formData, users)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    // Check if email already exists
    if (users.some((u) => u.login === formData.login)) {
      setFormErrors({ ...errors, login: "Cet email est déjà utilisé" })
      toast.error("Cet email est déjà utilisé")
      return
    }

    const newUser: CreateUserRequest = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      login: formData.login,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      role: formData.role,
      clinicId: formData.clinicId ?? undefined,
    }

    try {
      await createUserMutation.mutateAsync(newUser)
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Utilisateur créé avec succès")
    } catch {
      toast.error("Erreur lors de la création de l'utilisateur")
    }
  }

  const handleEditUser = async () => {
    if (!editingUser?.id) return

    const errors = validateForm(formData, users, true, editingUser.id)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    // Check if email already exists (excluding current user)
    if (users.some((u) => u.login === formData.login && u.id !== editingUser.id)) {
      setFormErrors({ ...errors, login: "Cet email est déjà utilisé" })
      toast.error("Cet email est déjà utilisé")
      return
    }

    const updatedUser: UserDTO = {
      ...editingUser,
      firstName: formData.firstName,
      lastName: formData.lastName,
      login: formData.login,
      phoneNumber: formData.phoneNumber,
      ...(formData.password && { password: formData.password }),
      role: formData.role,
      clinicId: formData.clinicId ?? undefined,
    }

    try {
      await updateUserMutation.mutateAsync({ id: editingUser.id, data: updatedUser })
      setIsEditDialogOpen(false)
      setEditingUser(null)
      resetForm()
      toast.success("Utilisateur modifié avec succès")
    } catch {
      toast.error("Erreur lors de la modification de l'utilisateur")
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      await deactivateUserMutation.mutateAsync(userId)
      toast.success("Utilisateur désactivé avec succès")
    } catch {
      toast.error("Erreur lors de la désactivation de l'utilisateur")
    }
  }

  const openEditDialog = (user: UserDTO) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      login: user.login,
      phoneNumber: user.phoneNumber,
      password: "",
      role: user.role,
      clinicId: user.clinicId ?? null,
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "MEDCIN":
        return "bg-primary/10 text-primary border-primary/20"
      case "SECRETAIRE":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur"
      case "MEDCIN":
        return "Médecin"
      case "SECRETAIRE":
        return "Secrétaire"
    }
  }

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", login: "", phoneNumber: "", password: "", role: "MEDCIN", clinicId: null })
    setFormErrors({})
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">Erreur lors du chargement des utilisateurs</p>
        </div>
      </DashboardLayout>
    )
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-1">
                      Prénom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Ex: Marie"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`glass-card border-border/50 ${formErrors.firstName ? "border-destructive" : ""}`}
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-1">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Ex: Dupont"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`glass-card border-border/50 ${formErrors.lastName ? "border-destructive" : ""}`}
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login" className="flex items-center gap-1">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="login"
                    type="email"
                    placeholder="email@cabinetx.com"
                    value={formData.login}
                    onChange={(e) => handleInputChange('login', e.target.value)}
                    className={`glass-card border-border/50 ${formErrors.login ? "border-destructive" : ""}`}
                  />
                  {formErrors.login && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.login}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                    Téléphone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+212 6XX XXX XXX"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={`glass-card border-border/50 ${formErrors.phoneNumber ? "border-destructive" : ""}`}
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.phoneNumber}
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
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
                    onValueChange={(value: UserRole) => {
                      setFormData(prev => ({ ...prev, role: value, clinicId: value === "ADMIN" ? null : prev.clinicId }))
                      if (formErrors.clinicId && value === "ADMIN") {
                        const newErrors = { ...formErrors }
                        delete newErrors.clinicId
                        setFormErrors(newErrors)
                      }
                    }}
                  >
                    <SelectTrigger className="glass-card border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEDCIN">Médecin</SelectItem>
                      <SelectItem value="SECRETAIRE">Secrétaire</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clinic Selection - Only for MEDCIN and SECRETAIRE */}
                {(formData.role === "MEDCIN" || formData.role === "SECRETAIRE") && (
                  <div className="space-y-2">
                    <Label htmlFor="clinicId" className="flex items-center gap-1">
                      Clinique <span className="text-destructive">*</span>
                    </Label>
                    <Combobox
                      options={activeClinics.map((clinic) => ({
                        value: clinic.id!.toString(),
                        label: clinic.name,
                        subtitle: clinic.address
                      }))}
                      value={formData.clinicId?.toString() ?? ""}
                      onValueChange={(value) => handleInputChange('clinicId', value ? Number(value) : null)}
                      placeholder="Sélectionner une clinique"
                      searchPlaceholder="Rechercher une clinique..."
                      emptyText="Aucune clinique trouvée"
                      className={formErrors.clinicId ? "border-destructive" : ""}
                      disabled={activeClinics.length === 0}
                    />
                    {formErrors.clinicId && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.clinicId}
                      </p>
                    )}
                  </div>
                )}
                <Button onClick={handleCreateUser} className="w-full glow-primary" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer l'utilisateur"
                  )}
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
              <div className="text-3xl font-bold text-primary">{users.filter((u) => u.role === "MEDCIN").length}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Secrétaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {users.filter((u) => u.role === "SECRETAIRE").length}
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
                  <TableHead>Téléphone</TableHead>
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
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.firstName} {user.lastName}</span>
                          {!user.active && (
                            <Badge variant="outline" className="w-fit text-xs text-muted-foreground">
                              Inactif
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.login}</TableCell>
                    <TableCell className="text-muted-foreground">{user.phoneNumber}</TableCell>
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
                          onClick={() => user.id && handleDeleteUser(user.id)}
                          className="hover:bg-destructive/10 text-destructive"
                          disabled={!user.active || deactivateUserMutation.isPending}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName" className="flex items-center gap-1">
                    Prénom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-firstName"
                    placeholder="Ex: Marie"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`glass-card border-border/50 ${formErrors.firstName ? "border-destructive" : ""}`}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-lastName" className="flex items-center gap-1">
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-lastName"
                    placeholder="Ex: Dupont"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`glass-card border-border/50 ${formErrors.lastName ? "border-destructive" : ""}`}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-login" className="flex items-center gap-1">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-login"
                  type="email"
                  placeholder="email@cabinetx.com"
                  value={formData.login}
                  onChange={(e) => handleInputChange('login', e.target.value)}
                  className={`glass-card border-border/50 ${formErrors.login ? "border-destructive" : ""}`}
                />
                {formErrors.login && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.login}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber" className="flex items-center gap-1">
                  Téléphone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-phoneNumber"
                  type="tel"
                  placeholder="+212 6XX XXX XXX"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`glass-card border-border/50 ${formErrors.phoneNumber ? "border-destructive" : ""}`}
                />
                {formErrors.phoneNumber && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.phoneNumber}
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
                  onChange={(e) => handleInputChange('password', e.target.value)}
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
                  onValueChange={(value: UserRole) => {
                    setFormData(prev => ({ ...prev, role: value, clinicId: value === "ADMIN" ? null : prev.clinicId }))
                    if (formErrors.clinicId && value === "ADMIN") {
                      const newErrors = { ...formErrors }
                      delete newErrors.clinicId
                      setFormErrors(newErrors)
                    }
                  }}
                >
                  <SelectTrigger className="glass-card border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEDCIN">Médecin</SelectItem>
                    <SelectItem value="SECRETAIRE">Secrétaire</SelectItem>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clinic Selection - Only for MEDCIN and SECRETAIRE */}
              {(formData.role === "MEDCIN" || formData.role === "SECRETAIRE") && (
                <div className="space-y-2">
                  <Label htmlFor="edit-clinicId" className="flex items-center gap-1">
                    Clinique <span className="text-destructive">*</span>
                  </Label>
                  <Combobox
                    options={activeClinics.map((clinic) => ({
                      value: clinic.id!.toString(),
                      label: clinic.name,
                      subtitle: clinic.address
                    }))}
                    value={formData.clinicId?.toString() ?? ""}
                    onValueChange={(value) => handleInputChange('clinicId', value ? Number(value) : null)}
                    placeholder="Sélectionner une clinique"
                    searchPlaceholder="Rechercher une clinique..."
                    emptyText="Aucune clinique trouvée"
                    className={formErrors.clinicId ? "border-destructive" : ""}
                    disabled={activeClinics.length === 0}
                  />
                  {formErrors.clinicId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.clinicId}
                    </p>
                  )}
                </div>
              )}
              <Button onClick={handleEditUser} className="w-full glow-primary" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
