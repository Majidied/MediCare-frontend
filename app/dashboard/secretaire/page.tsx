"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar, Users, Clock, FileText, Activity } from "lucide-react"

export default function SecretaireDashboard() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonjour, {user?.name}</h1>
          <p className="text-muted-foreground">Bienvenue sur votre espace secrétaire</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-6 rounded-xl glow-primary space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">RDV Aujourd'hui</p>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold">24</p>
            <p className="text-xs text-muted-foreground">+3 par rapport à hier</p>
          </div>

          <div className="glass-card p-6 rounded-xl glow-accent space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Patients en attente</p>
              <Users className="h-4 w-4 text-accent" />
            </div>
            <p className="text-3xl font-bold">8</p>
            <p className="text-xs text-muted-foreground">Temps moyen: 15 min</p>
          </div>

          <div className="glass-card p-6 rounded-xl glow-success space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">RDV à confirmer</p>
              <Clock className="h-4 w-4 text-success" />
            </div>
            <p className="text-3xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">À traiter rapidement</p>
          </div>

          <div className="glass-card p-6 rounded-xl glow-info space-y-2 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Nouveaux patients</p>
              <FileText className="h-4 w-4 text-info" />
            </div>
            <p className="text-3xl font-bold">5</p>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Rendez-vous du jour</h2>
              <Activity className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-3">
              {[
                { time: "09:00", patient: "Marie Dubois", status: "Confirmé", type: "Consultation" },
                { time: "09:30", patient: "Jean Martin", status: "En attente", type: "Suivi" },
                { time: "10:00", patient: "Sophie Laurent", status: "Confirmé", type: "Contrôle" },
                { time: "10:30", patient: "Pierre Durand", status: "À confirmer", type: "Consultation" },
                { time: "11:00", patient: "Claire Bernard", status: "Confirmé", type: "Urgence" },
              ].map((rdv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-xs font-medium text-primary">{rdv.time}</span>
                    </div>
                    <div>
                      <p className="font-medium">{rdv.patient}</p>
                      <p className="text-xs text-muted-foreground">{rdv.type}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rdv.status === "Confirmé"
                        ? "bg-success/10 text-success border border-success/20"
                        : rdv.status === "En attente"
                          ? "bg-warning/10 text-warning border border-warning/20"
                          : "bg-info/10 text-info border border-info/20"
                    }`}
                  >
                    {rdv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold">File d'attente</h2>
            <div className="space-y-3">
              {[
                { nom: "Ahmed El Mansouri", arrivee: "08:45", position: 1 },
                { nom: "Fatima Zahra", arrivee: "08:52", position: 2 },
                { nom: "Karim Benzema", arrivee: "09:01", position: 3 },
                { nom: "Leila Idrissi", arrivee: "09:08", position: 4 },
              ].map((patient) => (
                <div
                  key={patient.position}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/30">
                      <span className="text-lg font-bold text-primary">#{patient.position}</span>
                    </div>
                    <div>
                      <p className="font-medium">{patient.nom}</p>
                      <p className="text-xs text-muted-foreground">Arrivé à {patient.arrivee}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
