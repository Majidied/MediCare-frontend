"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Calendar, CreditCard, CheckCircle, Clock, AlertCircle, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SubscriptionPayment {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  period: string
  invoiceUrl?: string
}

interface Subscription {
  isActive: boolean
  plan: string
  startDate: string
  endDate: string
  daysRemaining: number
  monthlyPrice: number
  autoRenew: boolean
}

const MOCK_SUBSCRIPTION: Subscription = {
  isActive: true,
  plan: "Premium",
  startDate: "2025-01-01",
  endDate: "2025-02-01",
  daysRemaining: 17,
  monthlyPrice: 2500,
  autoRenew: true,
}

const MOCK_PAYMENT_HISTORY: SubscriptionPayment[] = [
  {
    id: "sub_1",
    date: "2025-01-01",
    amount: 2500,
    status: "paid",
    period: "Janvier 2025",
    invoiceUrl: "#",
  },
  {
    id: "sub_2",
    date: "2024-12-01",
    amount: 2500,
    status: "paid",
    period: "Décembre 2024",
    invoiceUrl: "#",
  },
  {
    id: "sub_3",
    date: "2024-11-01",
    amount: 2500,
    status: "paid",
    period: "Novembre 2024",
    invoiceUrl: "#",
  },
  {
    id: "sub_4",
    date: "2025-02-01",
    amount: 2500,
    status: "pending",
    period: "Février 2025",
  },
]
// </CHANGE>

export default function PaiementsPage() {
  const [subscription] = useState<Subscription>(MOCK_SUBSCRIPTION)
  const [payments] = useState<SubscriptionPayment[]>(MOCK_PAYMENT_HISTORY)

  const handlePayNow = () => {
    toast({
      title: "Redirection vers Stripe",
      description: "Vous allez être redirigé vers la page de paiement sécurisée Stripe...",
    })
    // Ici, intégration avec Stripe pour le paiement
  }

  const handleCancelSubscription = () => {
    toast({
      title: "Annulation de l'abonnement",
      description: "Votre abonnement sera annulé à la fin de la période en cours.",
      variant: "destructive",
    })
  }
  // </CHANGE>

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
      case "pending":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
      case "failed":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      default:
        return ""
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Payé"
      case "pending":
        return "En attente"
      case "failed":
        return "Échoué"
      default:
        return status
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abonnement du Cabinet</h1>
          <p className="text-muted-foreground">Gérez l'abonnement mensuel de votre cabinet médical</p>
        </div>

        <Card className="glass-card border-primary/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  Abonnement {subscription.plan}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Votre cabinet est actuellement abonné au plan {subscription.plan}
                </CardDescription>
              </div>
              <Badge
                className={
                  subscription.isActive
                    ? "bg-green-500/10 text-green-600 border-green-500/20 text-lg px-4 py-2"
                    : "bg-red-500/10 text-red-600 border-red-500/20 text-lg px-4 py-2"
                }
              >
                {subscription.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Prochain renouvellement</p>
                <p className="text-2xl font-bold text-primary">
                  {new Date(subscription.endDate).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Dans {subscription.daysRemaining} jour{subscription.daysRemaining > 1 ? "s" : ""}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Montant mensuel</p>
                <p className="text-2xl font-bold text-accent">{subscription.monthlyPrice.toLocaleString()} MAD</p>
                <p className="text-sm text-muted-foreground">Renouvellement automatique</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status de paiement</p>
                <div className="flex items-center gap-2">
                  {subscription.daysRemaining > 7 ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <p className="text-lg font-semibold text-green-500">À jour</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <p className="text-lg font-semibold text-orange-500">Expire bientôt</p>
                    </>
                  )}
                </div>
                {subscription.daysRemaining <= 7 && (
                  <Button onClick={handlePayNow} className="w-full mt-2 glow-button bg-primary">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payer maintenant
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* </CHANGE> */}

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Méthode de Paiement
            </CardTitle>
            <CardDescription>Gérez votre mode de paiement via Stripe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 rounded bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Stripe Connect</p>
                    <p className="text-sm text-muted-foreground">Paiements sécurisés via Stripe</p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connecté
                </Badge>
              </div>
              <div className="flex gap-3">
                <Button onClick={handlePayNow} className="flex-1 glow-button bg-primary">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Payer l'abonnement maintenant
                </Button>
                <Button onClick={handleCancelSubscription} variant="outline" className="flex-1 bg-transparent">
                  Annuler l'abonnement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* </CHANGE> */}

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle>Historique des Paiements</CardTitle>
            <CardDescription>Consultez tous vos paiements d'abonnement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                    </div>
                    <div>
                      <p className="font-medium">Abonnement - {payment.period}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{payment.amount.toLocaleString()} MAD</p>
                      <Badge className={getStatusColor(payment.status)}>{getStatusLabel(payment.status)}</Badge>
                    </div>
                    {payment.status === "paid" && payment.invoiceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => window.open(payment.invoiceUrl, "_blank")}
                      >
                        <CreditCard className="w-4 h-4" />
                        Facture
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* </CHANGE> */}
      </div>
    </DashboardLayout>
  )
}
