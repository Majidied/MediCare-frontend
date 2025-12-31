"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import keycloak from "./keycloak"

// Keycloak config constants - always available even before init
const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://3.84.72.92:8080'
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'cabinetX-microservice-realm'
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'cabinetx-client'

export type User = {
  id: string
  email: string
  name: string
  role: "admin" | "medecin" | "secretaire"
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Function to refresh token using stored refresh token
  const refreshTokenFromStorage = async (refreshToken: string) => {
    try {
      console.log("[v0] Tentative de rafraichissement du token depuis localStorage...")
      const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: KEYCLOAK_CLIENT_ID,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      })

      if (!response.ok) {
        console.log("[v0] Refresh token invalide ou expiré, nettoyage...")
        localStorage.removeItem("keycloak_token")
        localStorage.removeItem("keycloak_refresh_token")
        setIsLoading(false)
        return
      }

      const data = await response.json()
      const parsed = parseJwt(data.access_token)

      if (!parsed) {
        setIsLoading(false)
        return
      }

      // Update keycloak instance
      keycloak.token = data.access_token
      keycloak.refreshToken = data.refresh_token
      keycloak.tokenParsed = parsed
      keycloak.authenticated = true

      // Save new tokens
      localStorage.setItem("keycloak_token", data.access_token)
      localStorage.setItem("keycloak_refresh_token", data.refresh_token)

      // Set user
      const roles = parsed.realm_access?.roles || []
      const userRole = roles.includes("ADMIN") ? "admin" : roles.includes("MEDECIN") ? "medecin" : "secretaire"

      setUser({
        id: parsed.sub || "",
        email: parsed.email || "",
        name: parsed.name || parsed.preferred_username || "",
        role: userRole,
      })

      console.log("[v0] Session restaurée via refresh token")
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Erreur refresh token:", error)
      localStorage.removeItem("keycloak_token")
      localStorage.removeItem("keycloak_refresh_token")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log("Initialisation de Keycloak...")

    // Check for existing tokens in localStorage FIRST
    const storedToken = localStorage.getItem("keycloak_token")
    const storedRefreshToken = localStorage.getItem("keycloak_refresh_token")

    if (storedToken) {
      console.log("[v0] Token trouvé dans localStorage, vérification...")
      const parsed = parseJwt(storedToken)

      if (parsed && parsed.exp && parsed.exp * 1000 > Date.now()) {
        // Token is still valid - restore session immediately
        console.log("[v0] Token valide, restauration de la session...")

        keycloak.token = storedToken
        keycloak.refreshToken = storedRefreshToken || undefined
        keycloak.tokenParsed = parsed
        keycloak.authenticated = true

        const roles = parsed.realm_access?.roles || []
        const userRole = roles.includes("ADMIN") ? "admin" : roles.includes("MEDECIN") ? "medecin" : "secretaire"

        setUser({
          id: parsed.sub || "",
          email: parsed.email || "",
          name: parsed.name || parsed.preferred_username || "",
          role: userRole,
        })

        console.log("[v0] Session restaurée depuis localStorage pour:", parsed.name || parsed.preferred_username)
        setIsLoading(false)
        return // Skip Keycloak init - we already have a valid session
      } else if (storedRefreshToken) {
        // Access token expired but refresh token exists - try to refresh
        console.log("[v0] Token expiré, tentative de refresh...")
        refreshTokenFromStorage(storedRefreshToken)
        return
      } else {
        // Token expired and no refresh token - clean up
        console.log("[v0] Token expiré sans refresh token, nettoyage...")
        localStorage.removeItem("keycloak_token")
        localStorage.removeItem("keycloak_refresh_token")
      }
    }

    // No valid stored token - proceed with normal Keycloak init
    keycloak
      .init({
        onLoad: "check-sso",
        checkLoginIframe: false,
        pkceMethod: "S256",
      })
      .then((authenticated) => {
        console.log("Keycloak initialise. Authentifie:", authenticated)

        if (authenticated && keycloak.tokenParsed) {
          console.log("Token detecte:", keycloak.tokenParsed)

          const roles = keycloak.tokenParsed.realm_access?.roles || []
          const userRole = roles.includes("ADMIN") ? "admin" : roles.includes("MEDECIN") ? "medecin" : "secretaire"

          setUser({
            id: keycloak.tokenParsed.sub || "",
            email: keycloak.tokenParsed.email || "",
            name: keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username || "",
            role: userRole,
          })

          if (keycloak.token) {
            localStorage.setItem("keycloak_token", keycloak.token)
            console.log("Token sauvegarde")
          }
        }

        setIsLoading(false)
      })
      .catch((error) => {
        console.error("Erreur initialisation Keycloak:", error)
        setIsLoading(false)
      })

    const interval = setInterval(() => {
      keycloak
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed && keycloak.token) {
            console.log("Token rafraichi")
            localStorage.setItem("keycloak_token", keycloak.token)
          }
        })
        .catch(() => {
          console.error("Impossible de rafraichir le token")
        })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const login = async (email: string, password: string) => {
    console.log("Tentative de connexion pour:", email)

    try {
      if (keycloak.authenticated) {
        console.log("Nettoyage de la session Keycloak precedente...")
        keycloak.clearToken()
      }

      const tokenUrl = `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/token`
      console.log("URL token:", tokenUrl)

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: KEYCLOAK_CLIENT_ID,
          grant_type: "password",
          username: email,
          password: password,
        }),
      })

      console.log("Reponse Keycloak:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erreur login:", errorData)
        throw new Error(errorData.error_description || "Email ou mot de passe incorrect")
      }

      const data = await response.json()
      console.log("Token recu")

      keycloak.token = data.access_token
      keycloak.refreshToken = data.refresh_token
      keycloak.idToken = data.id_token

      const parsedToken = parseJwt(data.access_token)

      if (!parsedToken) {
        console.error("Erreur: Impossible de parser le token")
        throw new Error("Token not available after login.")
      }

      keycloak.tokenParsed = parsedToken
      keycloak.authenticated = true
      console.log("Token parse avec succes:", keycloak.tokenParsed)

      localStorage.setItem("keycloak_token", data.access_token)
      localStorage.setItem("keycloak_refresh_token", data.refresh_token)

      const roles = parsedToken.realm_access?.roles || []
      console.log("Roles extraits:", roles)

      const userRole = roles.includes("ADMIN") ? "admin" : roles.includes("MEDCIN") ? "medecin" : "secretaire"

      const newUser: User = {
        id: parsedToken.sub || "",
        email: parsedToken.email || email,
        name: parsedToken.name || parsedToken.preferred_username || email,
        role: userRole,
      }

      console.log("Utilisateur cree:", newUser)
      setUser(newUser)

      console.log("Redirection vers /dashboard/" + userRole)
      router.push(`/dashboard/${userRole}`)
    } catch (error: any) {
      console.error("Erreur lors de la connexion: Error:", error.message)
      throw error
    }
  }

  const logout = async () => {
    console.log("Deconnexion...")

    setUser(null)
    localStorage.removeItem("keycloak_token")
    localStorage.removeItem("keycloak_refresh_token")

    keycloak.clearToken()

    if (keycloak.authenticated) {
      try {
        await keycloak.logout({
          redirectUri: typeof window !== "undefined" ? window.location.origin + "/login" : undefined,
        })
      } catch (error) {
        console.error("Erreur lors de la deconnexion Keycloak:", error)
        router.push("/login")
      }
    } else {
      router.push("/login")
    }

    console.log("Deconnexion reussie")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

function parseJwt(token: string) {
  try {
    console.log("Parsing JWT token...")
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    const parsed = JSON.parse(jsonPayload)
    console.log("JWT parse avec succes")
    return parsed
  } catch (error) {
    console.error("Erreur parsing JWT:", error)
    return null
  }
}
