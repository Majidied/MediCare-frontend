"use client"

import { useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Calendar, CreditCard, CheckCircle, Clock, AlertCircle, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { billingApi, type BillingInvoiceDTO, type BillingPlanDTO, type BillingSubscriptionDTO } from "@/api/billing.api"
import { useAuth } from "@/lib/auth-context"
import { useCurrentUser } from "@/hooks/use-user"
import { loadStripe } from "@stripe/stripe-js"

type PaymentStatus = "paid" | "pending" | "failed"

const mapInvoiceStatus = (status?: BillingInvoiceDTO["status"]): PaymentStatus => {
  switch (status) {
    case "SUCCESSFUL":
      return "paid"
    case "PENDING":
    case "INITIATED":
      return "pending"
    case "FAILED":
    case "CANCELLED":
      return "failed"
    default:
      return "pending"
  }
}

const formatCurrency = (value: number | undefined, currency = "MAD") => {
  if (value === undefined || Number.isNaN(value)) return "-"
  return value.toLocaleString("fr-MA", { style: "currency", currency })
}

const computeDaysRemaining = (endDate?: string) => {
  if (!endDate) return null
  const end = new Date(endDate).getTime()
  const today = new Date().setHours(0, 0, 0, 0)
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  return diff < 0 ? 0 : diff
}

const formatPeriodLabel = (invoice: BillingInvoiceDTO) => {
  if (invoice.periodStart && invoice.periodEnd) {
    const start = new Date(invoice.periodStart)
    const end = new Date(invoice.periodEnd)
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    if (sameMonth) {
      return start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    }
    return `${start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`
  }
  return invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "Période"
}

const subscriptionLabel = (status?: BillingSubscriptionDTO["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "Actif"
    case "PENDING":
      return "En attente"
    case "INCOMPLETE":
    case "INCOMPLETE_EXPIRED":
      return "Incomplet"
    case "PAST_DUE":
      return "En retard"
    case "CANCELED":
      return "Annulé"
    case "UNPAID":
      return "Impayé"
    default:
      return "Inconnu"
  }
}

export default function PaiementsPage() {
  const { user } = useAuth()
  const { data: userDetails } = useCurrentUser(user?.email)
  const queryClient = useQueryClient()
  const cabinetId = userDetails?.clinicId ?? 0
  const customerEmail = userDetails?.email ?? user?.email ?? ""
  const customerName = userDetails?.name ?? user?.name ?? ""
  const stripePromise = useMemo(() => {
    if (typeof window === "undefined") return null
    const publishableKey =
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_STRIPE_PK ||
      ""
    if (!publishableKey) return null
    return loadStripe(publishableKey)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const status = params.get("status")
    if (status === "success" || status === "cancel") {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription", cabinetId] })
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices", cabinetId] })
    }
  }, [cabinetId, queryClient])

  const {
    data: subscription,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
    error: subscriptionErrorObj,
  } = useQuery({
    queryKey: ["billing", "subscription", cabinetId],
    queryFn: async () => {
      const { data } = await billingApi.getSubscription(cabinetId)
      return data
    },
    enabled: cabinetId > 0,
    staleTime: 60 * 1000,
  })

  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    isError: invoicesError,
    error: invoicesErrorObj,
  } = useQuery({
    queryKey: ["billing", "invoices", cabinetId],
    queryFn: async () => {
      const { data } = await billingApi.getInvoices(cabinetId)
      return data
    },
    enabled: cabinetId > 0,
    staleTime: 60 * 1000,
  })

  const {
    data: plans = [],
    isLoading: plansLoading,
    isError: plansError,
    error: plansErrorObj,
  } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: async () => {
      const { data } = await billingApi.getPlans()
      return data
    },
    staleTime: 5 * 60 * 1000,
  })

  const checkoutMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof billingApi.createCheckoutSession>[0]) => {
      const { data } = await billingApi.createCheckoutSession(payload)
      return data
    },
    onSuccess: async (data) => {
      if (data.url) {
        window.location.href = data.url
        return
      }
      if (data.sessionId) {
        if (!stripePromise) {
          toast({
            title: "Configuration Stripe manquante",
            description: "Ajoutez NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY pour activer la redirection.",
            variant: "destructive",
          })
          return
        }
        const stripe = await stripePromise
        if (!stripe) {
          toast({
            title: "Stripe indisponible",
            description: "Impossible d'initialiser Stripe côté client.",
            variant: "destructive",
          })
          return
        }
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
        if (error) {
          toast({
            title: "Redirection Stripe échouée",
            description: error.message,
            variant: "destructive",
          })
          return
        }
        return
      }
      toast({
        title: "Session Stripe créée",
        description: data.sessionId
          ? "Session créée, redirection Stripe possible via Stripe.js"
          : "Aucune URL de redirection fournie.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Paiement indisponible",
        description: error?.message || "Impossible de créer la session de paiement.",
        variant: "destructive",
      })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return billingApi.cancelSubscription({ cabinetId, cancelAtPeriodEnd: true })
    },
    onSuccess: () => {
      toast({
        title: "Abonnement mis à jour",
        description: "L'abonnement sera arrêté en fin de période.",
      })
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription", cabinetId] })
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices", cabinetId] })
    },
    onError: (error: any) => {
      toast({
        title: "Annulation impossible",
        description: error?.message || "Impossible d'annuler l'abonnement.",
        variant: "destructive",
      })
    },
  })

  const activePlan: BillingPlanDTO | undefined = useMemo(() => {
    if (subscription?.priceId) {
      return plans.find((plan) => plan.priceId === subscription.priceId)
    }
    return plans[0]
  }, [plans, subscription?.priceId])

  const daysRemaining = computeDaysRemaining(subscription?.currentPeriodEnd)
  const hasPlanPrice = Boolean(activePlan?.priceId)
  const isActive = subscription?.status === "ACTIVE"
  const canPay = hasPlanPrice && cabinetId > 0 && !isActive
  const priceValue = activePlan?.amount ?? 0
  const currency = activePlan?.currency ?? "MAD"
  const planLabel = subscription?.planName || activePlan?.name || "Plan"
  const hasSubscription = Boolean(subscription)
  const subscriptionStatusLabel = hasSubscription ? subscriptionLabel(subscription?.status) : "Aucun abonnement"
  const nextRenewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR")
    : "Non défini"
  const daysLabel =
    daysRemaining !== null
      ? `Dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`
      : "Période en cours"
  const isLoadingAny = subscriptionLoading || invoicesLoading || plansLoading
  const hasError = subscriptionError || invoicesError || plansError
  const errorMessage =
    (subscriptionErrorObj as any)?.message || (invoicesErrorObj as any)?.message || (plansErrorObj as any)?.message

  const payments = useMemo(() => {
    return invoices
      .map((invoice) => ({
        id: (
          invoice.id ??
          invoice.stripeInvoiceId ??
          (invoice.subscriptionId ? `${invoice.subscriptionId}-${invoice.createdAt || invoice.paidAt || ""}` : null) ??
          Math.random()
        ).toString(),
        date:
          invoice.paidAt || invoice.createdAt || invoice.periodEnd || invoice.periodStart || new Date().toISOString(),
        amount: invoice.amount,
        currency: invoice.currency || currency,
        status: mapInvoiceStatus(invoice.status),
        period: formatPeriodLabel(invoice),
        invoiceUrl: invoice.invoiceUrl,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [invoices, currency])

  const successUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard/medecin/paiements?status=success` : undefined
  const cancelUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard/medecin/paiements?status=cancel` : undefined

  const handlePayNow = () => {
    if (!cabinetId) {
      toast({ title: "Cabinet manquant", description: "Identifiant cabinet introuvable.", variant: "destructive" })
      return
    }
    if (!activePlan?.priceId) {
      toast({ title: "Plan indisponible", description: "Aucun plan Stripe configuré." })
      return
    }

    checkoutMutation.mutate({
      planId: activePlan.planId,
      priceId: activePlan.priceId,
      cabinetId,
      customerEmail,
      customerName,
      successUrl,
      cancelUrl,
    })
  }

  const handleCancelSubscription = () => {
    if (!cabinetId) {
      toast({ title: "Cabinet manquant", description: "Identifiant cabinet introuvable.", variant: "destructive" })
      return
    }
    cancelMutation.mutate()
  }

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
          {cabinetId === 0 && (
            <p className="text-sm text-red-500 mt-1">Aucun cabinet associé à cet utilisateur. Ajoutez un clinicId.</p>
          )}
        </div>

        {hasError && <p className="text-sm text-red-500">Erreur de chargement des données de facturation: {errorMessage}</p>}

        <Card className="glass-card border-primary/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  Abonnement {planLabel}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {subscription
                    ? "Votre cabinet est actuellement abonné."
                    : "Aucun abonnement actif pour ce cabinet."}
                </CardDescription>
              </div>
              <Badge
                className={
                  isActive
                    ? "bg-green-500/10 text-green-600 border-green-500/20 text-lg px-4 py-2"
                    : "bg-red-500/10 text-red-600 border-red-500/20 text-lg px-4 py-2"
                }
              >
                {subscriptionStatusLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Prochain renouvellement</p>
                <p className="text-2xl font-bold text-primary">
                  {nextRenewalDate}
                </p>
                <p className="text-sm text-muted-foreground">
                  {daysLabel}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Montant mensuel</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(priceValue, currency)}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.autoRenew ? "Renouvellement automatique activé" : "Renouvellement manuel"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status de paiement</p>
                <div className="flex items-center gap-2">
                  {subscription?.status === "PAST_DUE" || subscription?.status === "UNPAID" ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <p className="text-lg font-semibold text-orange-500">Paiement en attente</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <p className="text-lg font-semibold text-green-500">{subscriptionStatusLabel}</p>
                    </>
                  )}
                </div>
                {Boolean(cabinetId) && (
                  <Button
                    onClick={handlePayNow}
                    className="w-full mt-2 glow-button bg-primary"
                    disabled={checkoutMutation.isPending || isLoadingAny || !canPay}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {checkoutMutation.isPending ? "Ouverture Stripe..." : isActive ? "Abonnement actif" : "Payer maintenant"}
                  </Button>
                )}
                {!hasPlanPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Aucun plan Stripe configuré pour ce cabinet. Ajoutez un plan (priceId) côté backend pour activer le
                    paiement.
                  </p>
                )}
                {!cabinetId && (
                  <p className="text-xs text-muted-foreground mt-1">Associez un cabinet pour activer le paiement.</p>
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
                <Button
                  onClick={handlePayNow}
                  className="flex-1 glow-button bg-primary"
                  disabled={checkoutMutation.isPending || isLoadingAny || !canPay}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {checkoutMutation.isPending ? "Ouverture Stripe..." : isActive ? "Abonnement actif" : "Payer l'abonnement maintenant"}
                </Button>
                <Button
                  onClick={handleCancelSubscription}
                  variant="outline"
                  className="flex-1 bg-transparent"
                  disabled={cancelMutation.isPending || !subscription}
                >
                  {cancelMutation.isPending ? "Annulation..." : "Annuler l'abonnement"}
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
              {payments.length === 0 && !isLoadingAny && (
                <p className="text-sm text-muted-foreground">Aucun paiement trouvé pour ce cabinet.</p>
              )}
              {!hasPlanPrice && (
                <p className="text-sm text-muted-foreground">Aucun plan disponible. Configurez un priceId côté backend.</p>
              )}

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
                      <p className="font-bold text-lg">{formatCurrency(payment.amount, payment.currency)}</p>
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
