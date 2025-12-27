"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FloatingMedicalElements } from "@/components/floating-medical-elements"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.push(`/dashboard/${user.role}`)
    }
  }, [authLoading, isAuthenticated, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur CabinetX",
      })
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/10">
      <FloatingMedicalElements />

      <div className="absolute inset-0 bg-grid-pattern opacity-20 animate-pulse-slow" />

      <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-success/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
      <div className="absolute bottom-1/3 left-10 w-64 h-64 bg-info/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1500" />

      <div className="absolute top-6 right-6 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full glass-card glow-primary border-primary/20 hover:border-primary/40 transition-all"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card p-8 rounded-2xl glow-primary space-y-6 animate-fade-in-up">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 glow-accent mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              CabinetX
            </h1>
            <p className="text-sm text-muted-foreground">Connectez-vous à votre espace médical</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="medecin@cabinetx.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </div>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
            <p className="font-medium">Comptes de démonstration:</p>
            <p>Médecin: medecin@cabinetx.com / medecin123</p>
            <p>Secrétaire: secretaire@cabinetx.com / secretaire123</p>
            <p>Admin: admin@cabinetx.com / admin123</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in animation-delay-500">
          CabinetX - Gestion médicale du futur
        </p>
      </div>
    </div>
  )
}
