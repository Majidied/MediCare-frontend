"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useNotifications } from "@/lib/notifications-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, User, Stethoscope, Receipt, CreditCard, Banknote, Check } from "lucide-react"
import { useState } from "react"
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

export default function SecretaireNotificationsPage() {
  const { billingNotifications, markBillingAsProcessed } = useNotifications()
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [errors, setErrors] = useState<{ amount?: string }>({})
  const { toast } = useToast()

  const pendingNotifications = billingNotifications.filter((n) => n.status === "pending")
  const processedNotifications = billingNotifications.filter((n) => n.status === "processed")

  const handleGenerateInvoice = (notification: any) => {
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

  const handleSubmitInvoice = () => {
    if (!validateForm()) return

    const invoice = {
      id: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString("fr-FR"),
      patientName: selectedNotification.patientName,
      patientAge: selectedNotification.patientAge,
      consultationDate: selectedNotification.consultationDate,
      motif: selectedNotification.motif,
      diagnostic: selectedNotification.diagnostic,
      traitement: selectedNotification.traitement,
      notes: selectedNotification.notes,
      actes: selectedNotification.actes || [],
      amount: Number(amount),
      paymentMethod: paymentMethod === "cash" ? "Espèces" : "Carte bancaire",
    }

    setGeneratedInvoice(invoice)
    markBillingAsProcessed(selectedNotification.id)

    toast({
      title: "Facture générée",
      description: `Facture de ${amount} MAD générée avec succès pour ${selectedNotification.patientName}`,
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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Notifications de Facturation
          </h1>
          <p className="text-muted-foreground mt-2">Consultations terminées en attente de facturation</p>
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

          {pendingNotifications.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-muted-foreground">Aucune consultation en attente de facturation</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingNotifications.map((notification) => (
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
                          <h3 className="font-semibold text-lg">{notification.patientName}</h3>
                          <p className="text-sm text-muted-foreground">{notification.patientAge} ans</p>
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
                          <span className="font-medium">{notification.consultationDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Motif:</span>
                          <span className="font-medium">{notification.motif}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Stethoscope className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground">Diagnostic:</span>
                            <p className="font-medium">{notification.diagnostic}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground">Traitement:</span>
                            <p className="font-medium">{notification.traitement}</p>
                          </div>
                        </div>
                        {notification.notes && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">Notes:</span>
                              <p className="font-medium">{notification.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {notification.actes && notification.actes.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Actes réalisés:</p>
                          <div className="flex flex-wrap gap-2">
                            {notification.actes.map((acte, index) => (
                              <Badge key={index} variant="outline" className="bg-background/50">
                                {acte}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Envoyé par {notification.sentBy} • {notification.sentAt}
                      </div>
                      <Button onClick={() => handleGenerateInvoice(notification)} className="gap-2 glow-primary">
                        <Receipt className="w-4 h-4" />
                        Générer la facture
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
              {processedNotifications.map((notification) => (
                <Card key={notification.id} className="glass-card p-6 border-accent/20 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-accent/10 rounded-xl">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{notification.patientName}</h3>
                        <p className="text-sm text-muted-foreground">{notification.consultationDate}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                      Facturée
                    </Badge>
                  </div>
                </Card>
              ))}
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

          {selectedNotification && (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">{selectedNotification.patientName}</p>
                <p className="text-sm text-muted-foreground">{selectedNotification.consultationDate}</p>
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
          )}

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
                    <p className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Âge:</span>
                      <span className="font-semibold">{generatedInvoice.patientAge} ans</span>
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
                    <span className="text-muted-foreground font-medium">Motif:</span>
                    <span className="font-semibold">{generatedInvoice.motif}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground font-medium">Diagnostic:</span>
                    <span className="font-semibold">{generatedInvoice.diagnostic}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground font-medium">Traitement:</span>
                    <span className="font-semibold">{generatedInvoice.traitement}</span>
                  </div>
                  {generatedInvoice.notes && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground font-medium">Notes:</span>
                      <span className="font-semibold max-w-md text-right">{generatedInvoice.notes}</span>
                    </div>
                  )}
                </div>

                {generatedInvoice.actes && generatedInvoice.actes.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-sm text-muted-foreground font-medium">Actes réalisés:</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedInvoice.actes.map((acte, index) => (
                        <Badge key={index} variant="outline" className="text-sm py-1">
                          {acte}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
