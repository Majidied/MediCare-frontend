"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import keycloak from "./keycloak"

// Keycloak config constants - literal access for Next.js bundler compatibility
const KEYCLOAK_URL =
  (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_URL !== "undefined")
    ? process.env.NEXT_PUBLIC_KEYCLOAK_URL
    : 'http://3.84.72.92:8080'

const KEYCLOAK_REALM =
  (process.env.NEXT_PUBLIC_KEYCLOAK_REALM && process.env.NEXT_PUBLIC_KEYCLOAK_REALM !== "undefined")
    ? process.env.NEXT_PUBLIC_KEYCLOAK_REALM
    : 'cabinetX-microservice-realm'

const KEYCLOAK_CLIENT_ID =
  (process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID && process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID !== "undefined")
    ? process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
    : 'cabinetx-client'

export type User = {
  id: string
  email: string
  name: string
  role: "admin" | "medecin" | "secretaire"
  cabinetId?: number // Cabinet ID for doctors and secretaries
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  hasTokens: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasTokens, setHasTokens] = useState(false)
  const router = useRouter()

  useEffect(() => {
    console.log("Initialisation de Keycloak...")

    const storedToken = localStorage.getItem("keycloak_token")
    const storedRefreshToken = localStorage.getItem("keycloak_refresh_token")

    setHasTokens(!!storedToken || !!storedRefreshToken)

    // Optimistically preload user from valid stored token to avoid UI flicker
    const preload = parseJwt(storedToken || "")
    if (preload && preload.exp && preload.exp * 1000 > Date.now()) {
      const roles = preload.realm_access?.roles || []
      const userRole: "admin" | "medecin" | "secretaire" = roles.includes("ADMIN")
        ? "admin"
        : roles.includes("MEDCIN")
          ? "medecin"
          : "secretaire"

      setUser({
        id: preload.sub || "",
        email: preload.email || "",
        name: preload.name || preload.preferred_username || "",
        role: userRole,
      })
    }

    const initOptions: any = {
      onLoad: "check-sso",
      checkLoginIframe: false,
      pkceMethod: "S256",
    }

    // If we have stored tokens, use them to initialize Keycloak
    if (storedToken) {
      console.log("Token trouvé dans localStorage, tentative de restauration...")
      const parsed = parseJwt(storedToken)

      if (parsed && parsed.exp && parsed.exp * 1000 > Date.now()) {
        console.log("Token encore valide, restauration...")
        initOptions.token = storedToken
        initOptions.refreshToken = storedRefreshToken || undefined
      } else if (storedRefreshToken) {
        console.log("Token expiré, tentative avec refresh token...")
        initOptions.token = storedToken // Keep expired token for refresh
        initOptions.refreshToken = storedRefreshToken
      } else {
        console.log("Token expiré sans refresh token, nettoyage...")
        localStorage.removeItem("keycloak_token")
        localStorage.removeItem("keycloak_refresh_token")
        localStorage.removeItem("user_role")
      }
    }

    keycloak
      .init(initOptions)
      .then((authenticated) => {
        console.log("Keycloak initialise. Authentifie:", authenticated)

        if (authenticated && keycloak.tokenParsed) {
          console.log("Session active:", keycloak.tokenParsed.preferred_username)

          const roles = keycloak.tokenParsed.realm_access?.roles || []
          const userRole: "admin" | "medecin" | "secretaire" = roles.includes("ADMIN") ? "admin" : roles.includes("MEDCIN") ? "medecin" : "secretaire"

          // Fetch user details from backend using email to get cabinetId
          const userEmail = keycloak.tokenParsed.email || keycloak.tokenParsed.preferred_username
          const token = keycloak.token

          if (userEmail && token) {
            fetch(`http://localhost:8080/api/users/login/${userEmail}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
              .then(res => res.ok ? res.json() : null)
              .then(userData => {
                console.log("[Init] User found:", userData)
                const cabinetId = userData?.clinicId
                console.log("[Init] User found:", userData?.firstName, userData?.lastName)
                console.log("[Init] Cabinet ID récupéré:", cabinetId)

                setUser({
                  id: keycloak.tokenParsed.sub || "",
                  email: userEmail,
                  name: keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username || "",
                  role: userRole,
                  cabinetId: cabinetId,
                })
              })
              .catch(error => {
                console.error("Erreur récupération cabinet ID:", error)
                // Set user without cabinetId on error
                setUser({
                  id: keycloak.tokenParsed.sub || "",
                  email: keycloak.tokenParsed.email || "",
                  name: keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username || "",
                  role: userRole,
                })
              })
          } else {
            // Set user without cabinetId if no email/token
            setUser({
              id: keycloak.tokenParsed.sub || "",
              email: keycloak.tokenParsed.email || "",
              name: keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username || "",
              role: userRole,
            })
          }

          // Store user role in localStorage for persistence
          localStorage.setItem("user_role", userRole)

          if (keycloak.token) {
            localStorage.setItem("keycloak_token", keycloak.token)
            if (keycloak.refreshToken) {
              localStorage.setItem("keycloak_refresh_token", keycloak.refreshToken)
            }
          }
        } else {
          // If init failed, keep any preloaded user; otherwise leave as null
          console.log("Init non authentifié, aucun changement d'état utilisateur")
        }

        setIsLoading(false)
      })
      .catch((error) => {
        console.error("Erreur initialisation Keycloak:", error)
        setIsLoading(false)
      })

    const interval = setInterval(() => {
      if (keycloak.authenticated) {
        keycloak
          .updateToken(70)
          .then((refreshed) => {
            if (refreshed && keycloak.token) {
              console.log("Token rafraichi automatiquement")
              localStorage.setItem("keycloak_token", keycloak.token)
              if (keycloak.refreshToken) {
                localStorage.setItem("keycloak_refresh_token", keycloak.refreshToken)
              }
            }
          })
          .catch((error) => {
            console.error("Erreur refresh token:", error)
            // Just log the error, don't force logout
            // User will be logged out naturally when trying to make API calls
          })
      }
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

      const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`
      console.log("🔐 [CABINETX_DEBUG] Tentative de connexion via URL:", tokenUrl)

      let response
      try {
        response = await fetch(tokenUrl, {
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
      } catch (fetchError: any) {
        console.error("🌐 [CABINETX_DEBUG] Erreur réseau lors du fetch:", fetchError)
        throw new Error("Impossible de contacter le serveur d'authentification. Vérifiez votre connexion.")
      }

      console.log("📡 [CABINETX_DEBUG] Réponse Keycloak:", response.status, response.statusText)

      const contentType = response.headers.get("content-type")

      if (!response.ok) {
        let errorMessage = `Erreur de connexion (${response.status})`
        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            console.error("❌ [CABINETX_DEBUG] Erreur Keycloak (JSON):", errorData)
            errorMessage = errorData.error_description || errorMessage
          } else {
            const errorText = await response.text()
            console.error("❌ [CABINETX_DEBUG] Erreur Keycloak (Texte/HTML):", errorText.substring(0, 500))
            errorMessage = `Erreur serveur: ${response.statusText || response.status}`
          }
        } catch (e) {
          console.error("❌ [CABINETX_DEBUG] Erreur lecture erreur:", e)
        }
        throw new Error(errorMessage)
      }

      // Safe JSON parsing for successful response
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("⚠️ [CABINETX_DEBUG] Succès (200) mais contenu non-JSON reçu:", text.substring(0, 500))
        throw new Error("Le serveur a renvoyé un format invalide (HTML au lieu de JSON).")
      }

      const data = await response.json()
      console.log("✅ [CABINETX_DEBUG] Token reçu avec succès")

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

      // Fetch user details from backend using email to get cabinetId
      let cabinetId: number | undefined = undefined
      try {
        const userEmail = parsedToken.email || parsedToken.preferred_username
        if (userEmail) {
          const userResponse = await fetch(`http://localhost:8080/api/users/login/${userEmail}`, {
            headers: {
              'Authorization': `Bearer ${data.access_token}`
            }
          })
          if (userResponse.ok) {
            const userData = await userResponse.json()
            cabinetId = userData.clinicId
            console.log("[Login] User found:", userData.firstName, userData.lastName)
            console.log("[Login] Cabinet ID récupéré:", cabinetId)
          }
        }
      } catch (error) {
        console.error("Erreur récupération cabinet ID:", error)
      }

      const newUser: User = {
        id: parsedToken.sub || "",
        email: parsedToken.email || email,
        name: parsedToken.name || parsedToken.preferred_username || email,
        role: userRole,
        cabinetId: cabinetId,
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
    setHasTokens(false)
    localStorage.removeItem("keycloak_token")
    localStorage.removeItem("keycloak_refresh_token")
    localStorage.removeItem("user_role")

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
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, hasTokens }}>
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
    if (!token) {
      return null
    }

    const parts = token.split(".")
    if (parts.length < 2 || !parts[1]) {
      return null
    }

    const base64Url = parts[1]
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
