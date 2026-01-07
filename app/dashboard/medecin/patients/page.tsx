"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Calendar, Phone, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { usePatients } from "@/hooks/use-patient"
import { useAuth } from "@/lib/auth-context"
import { useCurrentUser } from "@/hooks/use-user"

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const { data: userDetails } = useCurrentUser(user?.email)
  const cabinetId = userDetails?.clinicId ?? 0

  const { data: patients = [], isLoading, isError, error } = usePatients(cabinetId)

  const filteredPatients = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return patients.filter((patient) => {
      const fullName = `${patient.nom ?? ""} ${patient.prenom ?? ""}`.toLowerCase()
      const cin = (patient.cin ?? "").toLowerCase()
      const mutuelle = (patient.typeMutuelle ?? "").toLowerCase()
      return fullName.includes(query) || cin.includes(query) || mutuelle.includes(query)
    })
  }, [patients, searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Actif":
        return "bg-success/10 text-success border-success/20"
      case "Inactif":
        return "bg-muted/10 text-muted-foreground border-muted/20"
      default:
        return "bg-primary/10 text-primary border-primary/20"
    }
  }

  const newPatientsThisMonth = (() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

    return patients.filter((patient) => {
      if (!patient.createdAt) return false
      const created = new Date(patient.createdAt)
      return !Number.isNaN(created.getTime()) && created.getMonth() === month && created.getFullYear() === year
    }).length
  })()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Liste des Patients</h1>
            <p className="text-muted-foreground">Gérez vos patients et accédez à leurs dossiers médicaux</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Chargement des patients...</span>
          </div>
        ) : isError ? (
          <Card className="glass-card p-6">
            <p className="text-destructive">Erreur : {(error as any)?.message || "Impossible de charger les patients"}</p>
          </Card>
        ) : (
          <>
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
                    <h3 className="text-2xl font-bold mt-2">{newPatientsThisMonth}</h3>
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
                <Input
                  placeholder="Rechercher par nom, CIN, mutuelle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </Card>

            {/* Patients Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((patient) => (
                <Link key={patient.id} href={`/dashboard/medecin/patients/${patient.id}`}>
                  <Card className="glass-card p-6 hover:scale-105 hover:border-primary/50 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-lg font-bold text-primary">
                            {patient.nom[0]}{patient.prenom[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{patient.nom} {patient.prenom}</h3>
                          <p className="text-xs text-muted-foreground">CIN: {patient.cin}</p>
                        </div>
                      </div>
                      <Badge className="bg-success/10 text-success border-success/20">Actif</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{patient.dateNaissance}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{patient.numTel}</span>
                      </div>
                      {patient.typeMutuelle && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span>{patient.typeMutuelle}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Voir le dossier</span>
                      <span className="text-primary group-hover:translate-x-1 transition-transform">
                        Voir dossier →
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {filteredPatients.length === 0 && !isLoading && (
              <Card className="glass-card p-12 text-center">
                <p className="text-muted-foreground">Aucun patient trouvé</p>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
