"use client"

import type React from "react"
import { DollarSign, Building2 } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notifications-context"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Moon,
  Sun,
  Bell,
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  Menu,
  X,
  UserPlus,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { unreadCount, unreadBillingCount } = useNotifications()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/")
    }
  }, [mounted, authLoading, user, router])

  if (!mounted || authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const notificationCount = user.role === "medecin" ? unreadCount : user.role === "secretaire" ? unreadBillingCount : 0

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleRequestNextPatient = () => {
    toast({
      title: "Demande envoyée",
      description: "Notification envoyée à la secrétaire",
    })
    router.push(`/dashboard/${user.role}`)
  }

  // Navigation items based on role
  const getNavItems = () => {
    const baseItems = [{ icon: LayoutDashboard, label: "Dashboard", href: `/dashboard/${user.role}` }]

    if (user.role === "admin") {
      return [
        ...baseItems,
        { icon: Building2, label: "Cabinets", href: `/dashboard/${user.role}/cabinets` },
        { icon: Users, label: "Utilisateurs", href: `/dashboard/${user.role}/users` },
        { icon: FileText, label: "Médicaments", href: `/dashboard/${user.role}/medications` },
        { icon: Settings, label: "Paramètres", href: `/dashboard/${user.role}/settings` },
      ]
    }

    if (user.role === "medecin") {
      return [
        ...baseItems,
        { icon: Bell, label: "Notifications", href: `/dashboard/${user.role}/notifications` },
        { icon: Users, label: "Patients", href: `/dashboard/${user.role}/patients` },
        { icon: DollarSign, label: "Paiements", href: `/dashboard/${user.role}/paiements` },
      ]
    }

    if (user.role === "secretaire") {
      return [
        ...baseItems,
        { icon: Calendar, label: "Rendez-vous", href: `/dashboard/${user.role}/rendez-vous` },
        { icon: Calendar, label: "File d'attente", href: `/dashboard/${user.role}/queue` },
        { icon: Users, label: "Patients", href: `/dashboard/${user.role}/patients` },
        { icon: Bell, label: "Notifications", href: `/dashboard/${user.role}/notifications` },
      ]
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-full glass-card border-r border-border/50 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-border/50">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 glow-accent">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              CabinetX
            </h1>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 ${isActive ? "glow-primary" : "hover:bg-primary/5"}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Navbar */}
        <header className="sticky top-0 z-20 glass-card border-b border-border/50 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <h2 className="text-lg font-semibold">Dashboard {user.role}</h2>
            </div>

            <div className="flex items-center gap-2">
              {user.role === "medecin" && (
                <Button variant="default" size="sm" onClick={handleRequestNextPatient} className="gap-2 glow-primary">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Patient suivant</span>
                </Button>
              )}

              {(user.role === "medecin" || user.role === "secretaire") && (
                <Link href={`/dashboard/${user.role}/notifications`}>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 relative">
                    <Bell className="w-4 h-4" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-pulse">
                        {notificationCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full hover:bg-primary/5"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="rounded-full hover:bg-destructive/10 text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
