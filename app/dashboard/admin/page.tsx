"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Users, Building2, Calendar, DollarSign, TrendingUp, Activity } from "lucide-react"

export default function AdminDashboard() {
  const stats = [
    {
      title: "Utilisateurs Totaux",
      value: "156",
      change: "+12%",
      icon: Users,
      trend: "up",
    },
    {
      title: "Cabinets Actifs",
      value: "23",
      change: "+3",
      icon: Building2,
      trend: "up",
    },
    {
      title: "Rendez-vous",
      value: "1,247",
      change: "+18%",
      icon: Calendar,
      trend: "up",
    },
    {
      title: "Revenus Mensuels",
      value: "45,231€",
      change: "+8%",
      icon: DollarSign,
      trend: "up",
    },
  ]

  const recentActivity = [
    { action: "Nouveau médecin inscrit", user: "Dr. Martin Dupont", time: "Il y a 2h" },
    { action: "Cabinet créé", user: "Cabinet Santé Plus", time: "Il y a 5h" },
    { action: "Nouvelle secrétaire", user: "Marie Lambert", time: "Il y a 1j" },
    { action: "Mise à jour système", user: "Admin", time: "Il y a 2j" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la plateforme CabinetX</p>
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
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change} ce mois
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Activité Récente</h2>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Statistiques Hebdomadaires</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Nouveaux utilisateurs</span>
                  <span className="text-sm font-semibold">23</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[78%] rounded-full animate-progress" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Consultations effectuées</span>
                  <span className="text-sm font-semibold">189</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[92%] rounded-full animate-progress animation-delay-200" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Taux de satisfaction</span>
                  <span className="text-sm font-semibold">96%</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-success w-[96%] rounded-full animate-progress animation-delay-400" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
