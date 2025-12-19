"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, FileText, Clock, CheckCircle, Search, Stethoscope } from "lucide-react"

export default function MedecinDashboard() {
  const stats = [
    {
      title: "Consultations du jour",
      value: "12",
      change: "+3",
      icon: Stethoscope,
      trend: "up",
    },
    {
      title: "Patients Actifs",
      value: "248",
      change: "+15",
      icon: Users,
      trend: "up",
    },
    {
      title: "Rendez-vous du jour",
      value: "8",
      change: "2 en attente",
      icon: Calendar,
      trend: "neutral",
    },
    {
      title: "Ordonnances",
      value: "34",
      change: "Cette semaine",
      icon: FileText,
      trend: "up",
    },
  ]

  const todayAppointments = [
    {
      time: "09:00",
      patient: "Marie Dubois",
      type: "Consultation",
      status: "confirmed",
    },
    {
      time: "10:30",
      patient: "Jean Martin",
      type: "Suivi",
      status: "confirmed",
    },
    {
      time: "11:00",
      patient: "Sophie Laurent",
      type: "Urgence",
      status: "pending",
    },
    {
      time: "14:00",
      patient: "Pierre Durand",
      type: "Consultation",
      status: "confirmed",
    },
  ]

  const recentConsultations = [
    { patient: "Alice Bernard", date: "Aujourd'hui 08:30", diagnosis: "Grippe saisonnière" },
    { patient: "Marc Petit", date: "Hier 16:00", diagnosis: "Contrôle de routine" },
    { patient: "Emma Rousseau", date: "Hier 14:30", diagnosis: "Allergie" },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmé
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Médecin</h1>
            <p className="text-muted-foreground">Bienvenue Dr. Martin - Vue d'ensemble de votre journée</p>
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
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Rendez-vous du Jour</h2>
              </div>
              <Button variant="outline" size="sm" className="border-primary/20 bg-transparent">
                <Search className="w-4 h-4 mr-2" />
                Voir tout
              </Button>
            </div>
            <div className="space-y-3">
              {todayAppointments.map((apt, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-xs text-muted-foreground">Heure</span>
                    <span className="text-sm font-bold">{apt.time}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{apt.patient}</p>
                    <p className="text-sm text-muted-foreground">{apt.type}</p>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Consultations Récentes</h2>
            </div>
            <div className="space-y-3">
              {recentConsultations.map((consultation, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium">{consultation.patient}</p>
                    <Badge variant="outline" className="text-xs">
                      {consultation.date}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{consultation.diagnosis}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 border-primary/20 bg-transparent">
              Voir l'historique complet
            </Button>
          </Card>
        </div>

        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Statistiques Hebdomadaires</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Consultations effectuées</span>
                <span className="text-sm font-semibold">47</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[85%] rounded-full animate-progress" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Ordonnances créées</span>
                <span className="text-sm font-semibold">34</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-accent w-[72%] rounded-full animate-progress animation-delay-200" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Taux de présence</span>
                <span className="text-sm font-semibold">92%</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-success w-[92%] rounded-full animate-progress animation-delay-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
