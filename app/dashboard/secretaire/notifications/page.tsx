"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useNotifications } from "@/hooks/use-notifications"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, User, Stethoscope, Receipt, CreditCard, Banknote, Check, RefreshCw } from "lucide-react"
import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { validatePositiveNumber } from "@/lib/validation.utils"
import type { Notification } from "@/api/notification.api"

export default function SecretaireNotificationsPage() {
  // Use backend notifications instead of localStorage
  const { notifications, isLoading, markAsRead, refreshNotifications } = useNotifications()
  
  // Filter for billing notifications only
  const billingNotifications = useMemo(() => 
    notifications.filter((n) => n.type === "BILLING_READY"), 
    [notifications]
  )
  
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [errors, setErrors] = useState<{ amount?: string }>({})
  const { toast } = useToast()

  // pending = status 'pending', processed = status 'read'
  const pendingNotifications = useMemo(() => 
    billingNotifications.filter((n) => n.status === "pending"), 
    [billingNotifications]
  )
  const processedNotifications = useMemo(() => 
    billingNotifications.filter((n) => n.status === "read"), 
    [billingNotifications]
  )

  // Helper to parse content for display (content format: "La consultation de X est terminée. Diagnostic: Y. Prête pour facturation.")
  const parseNotificationContent = (notification: Notification) => {
    const content = notification.content || ""
    // Extract patient name from content (between "de " and " est terminée")
    const patientMatch = content.match(/de (.+?) est terminée/)
    const patientName = patientMatch ? patientMatch[1] : "Patient inconnu"
    
    // Extract diagnostic from content (between "Diagnostic: " and ". Prête")
    const diagMatch = content.match(/Diagnostic: (.+?)\. Prête/)
    const diagnostic = diagMatch ? diagMatch[1] : "Non spécifié"
    
    return {
      patientName,
      diagnostic,
      consultationDate: new Date(notification.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      consultationId: notification.consultationId,
      appointmentId: notification.appointmentId,
      patientId: notification.patientId,
    }
  }

  const handleGenerateInvoice = (notification: Notification) => {
    setSelectedNotification(notification)
    setShowInvoiceDialog(true)
    setAmount("")
    setPaymentMethod("cash")
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: { amount?: string } = {}

    // Validate amount
    const amountValidation = validatePositiveNumber(amount, "Le montant")
    if (!amountValidation.valid) {
      newErrors.amount = amountValidation.error!
    } else if (Number(amount) > 1000000) {
      newErrors.amount = "Le montant est trop élevé (max 1,000,000 MAD)"
    } else if (Number(amount) < 1) {
      newErrors.amount = "Le montant doit être au moins 1 MAD"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitInvoice = async () => {
    if (!validateForm() || !selectedNotification) return

    const parsed = parseNotificationContent(selectedNotification)
    
    const invoice = {
      id: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString("fr-FR"),
      patientName: parsed.patientName,
      consultationDate: parsed.consultationDate,
      diagnostic: parsed.diagnostic,
      amount: Number(amount),
      paymentMethod: paymentMethod === "cash" ? "Espèces" : "Carte bancaire",
    }

    setGeneratedInvoice(invoice)
    
    // Mark notification as read (processed)
    await markAsRead(selectedNotification.id)

    toast({
      title: "Facture générée",
      description: `Facture de ${amount} MAD générée avec succès pour ${parsed.patientName}`,
    })

    setShowInvoiceDialog(false)
    setShowPrintDialog(true)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Notifications de Facturation
            </h1>
            <p className="text-muted-foreground mt-2">Consultations terminées en attente de facturation</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refreshNotifications()} 
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card p-6 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-3xl font-bold text-primary">{pendingNotifications.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 border-accent/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Traitées</p>
                <p className="text-3xl font-bold text-accent">{processedNotifications.length}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-xl">
                <Check className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Notifications */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Consultations à facturer
          </h2>

          {isLoading ? (
            <Card className="glass-card p-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Chargement des notifications...</p>
            </Card>
          ) : pendingNotifications.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-muted-foreground">Aucune consultation en attente de facturation</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingNotifications.map((notification) => {
                const parsed = parseNotificationContent(notification)
                return (
                <Card
                  key={notification.id}
                  className="glass-card p-6 border-primary/20 hover:border-primary/40 transition-all"
                >
                  <div className="space-y-4">
                    {/* Patient Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{parsed.patientName}</h3>
                          <p className="text-sm text-muted-foreground">Consultation #{parsed.consultationId}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        En attente
                      </Badge>
                    </div>

                    <Separator />

                    {/* Consultation Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">{parsed.consultationDate}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Stethoscope className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground">Diagnostic:</span>
                            <p className="font-medium">{parsed.diagnostic}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground">Titre:</span>
                            <p className="font-medium">{notification.title}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Reçu le {parsed.consultationDate}
                      </div>
                      <Button onClick={() => handleGenerateInvoice(notification)} className="gap-2 glow-primary">
                        <Receipt className="w-4 h-4" />
                        Générer la facture
                      </Button>
                    </div>
                  </div>
                </Card>
              )})}
            </div>
          )}
        </div>

        {/* Processed Notifications */}
        {processedNotifications.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              Consultations facturées
            </h2>
            <div className="space-y-4">
              {processedNotifications.map((notification) => {
                const parsed = parseNotificationContent(notification)
                return (
                <Card key={notification.id} className="glass-card p-6 border-accent/20 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-accent/10 rounded-xl">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{parsed.patientName}</h3>
                        <p className="text-sm text-muted-foreground">{parsed.consultationDate}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                      Facturée
                    </Badge>
                  </div>
                </Card>
              )})}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Générer une facture</DialogTitle>
            <DialogDescription>
              Saisissez le montant et choisissez le mode de paiement pour générer la facture
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (() => {
            const parsed = parseNotificationContent(selectedNotification)
            return (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">{parsed.patientName}</p>
                <p className="text-sm text-muted-foreground">{parsed.consultationDate}</p>
                <p className="text-sm text-muted-foreground">Diagnostic: {parsed.diagnostic}</p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Montant (MAD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Ex: 300"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    if (errors.amount) setErrors({ ...errors, amount: undefined })
                  }}
                  className={errors.amount ? "border-destructive" : ""}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span>⚠</span> {errors.amount}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Méthode de paiement</Label>
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                      <Banknote className="w-4 h-4" />
                      Espèces
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="w-4 h-4" />
                      Carte bancaire
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )})()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitInvoice} className="gap-2 glow-primary">
              <Receipt className="w-4 h-4" />
              Générer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Invoice Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto glass-card border-primary/20">
          <DialogHeader className="print:hidden">
            <DialogTitle>Facture générée</DialogTitle>
            <DialogDescription>Vous pouvez maintenant imprimer ou télécharger la facture</DialogDescription>
          </DialogHeader>

          {generatedInvoice && (
            <div className="space-y-6 p-6 bg-white dark:bg-card print:bg-white" id="invoice-content">
              {/* Invoice Header */}
              <div className="text-center border-b-2 border-primary pb-6">
                <h1 className="text-4xl font-bold text-primary mb-2">CabinetX</h1>
                <p className="text-base text-muted-foreground font-medium">Cabinet Médical</p>
                <p className="text-sm text-muted-foreground mt-2">123 Avenue Mohammed V, Casablanca</p>
                <p className="text-sm text-muted-foreground">Tél: +212 5 22 XX XX XX | Email: contact@cabinetx.ma</p>
              </div>

              {/* Invoice Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-bold text-lg border-b pb-2">Informations Patient</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Nom:</span>
                      <span className="font-semibold">{generatedInvoice.patientName}</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-right">
                  <h3 className="font-bold text-lg border-b pb-2">Détails Facture</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-muted-foreground font-medium">N° Facture:</span>
                      <span className="font-semibold">{generatedInvoice.id}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Date d'émission:</span>
                      <span className="font-semibold">{generatedInvoice.date}</span>
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Consultation Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Détails de la consultation</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground font-medium">Date de consultation:</span>
                    <span className="font-semibold">{generatedInvoice.consultationDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground font-medium">Diagnostic:</span>
                    <span className="font-semibold">{generatedInvoice.diagnostic}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Détails du paiement</h3>
                <div className="flex justify-between text-base py-2">
                  <span className="text-muted-foreground font-medium">Méthode de paiement:</span>
                  <span className="font-semibold">{generatedInvoice.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center bg-primary/10 p-6 rounded-lg border-2 border-primary/30">
                  <span className="font-bold text-xl">TOTAL À PAYER:</span>
                  <span className="font-bold text-3xl text-primary">{generatedInvoice.amount} MAD</span>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Footer */}
              <div className="text-center space-y-2 pt-4">
                <p className="text-sm text-muted-foreground font-medium">Merci de votre confiance</p>
                <p className="text-xs text-muted-foreground">Cette facture est générée automatiquement par CabinetX</p>
                <p className="text-xs text-muted-foreground mt-4">
                  Pour toute question, contactez-nous au +212 5 22 XX XX XX
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="print:hidden mt-4">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Fermer
            </Button>
            <Button onClick={handlePrint} className="gap-2 glow-primary">
              <Receipt className="w-4 h-4" />
              Imprimer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          #invoice-content,
          #invoice-content * {
            visibility: visible;
          }
          
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .dark #invoice-content {
            background: white !important;
          }
          
          .dark #invoice-content * {
            color: black !important;
          }
          
          .text-primary {
            color: #10b981 !important;
          }
          
          .text-muted-foreground {
            color: #666 !important;
          }
          
          .border-primary {
            border-color: #10b981 !important;
          }
          
          .bg-primary\\/10 {
            background-color: #d1fae5 !important;
          }
        }
      `}</style>
    </DashboardLayout>
  )
}
