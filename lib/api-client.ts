import axios from 'axios'
import keycloak from './keycloak'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor REQUEST: Ajouter le token JWT à chaque requête
apiClient.interceptors.request.use(
  (config) => {
    console.log("⬆️ Requête sortante:", config.method?.toUpperCase(), config.url)
    
    // Récupérer le token depuis Keycloak ou localStorage
    const token = keycloak.token || localStorage.getItem('keycloak_token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("🔑 Token JWT ajouté au header Authorization")
      console.log("🎫 Token (10 premiers chars):", token.substring(0, 10) + "...")
    } else {
      console.log("⚠️ Aucun token disponible")
    }
    
    console.log("📍 URL complète:", config.baseURL + config.url)
    return config
  },
  (error) => {
    console.error("❌ Erreur dans request interceptor:", error)
    return Promise.reject(error)
  }
)

// Interceptor RESPONSE: Gérer les erreurs et refresh token
apiClient.interceptors.response.use(
  (response) => {
    console.log("⬇️ Réponse reçue:", response.status, response.config.url)
    console.log("📦 Données:", response.data)
    return response
  },
  async (error) => {
    console.error("❌ Erreur API:", error.message)
    
    if (error.response) {
      console.error("📛 Status:", error.response.status)
      console.error("📛 Data:", error.response.data)
      
      // Si erreur 401, tenter de refresh le token
      if (error.response.status === 401) {
        console.log("🔄 Erreur 401, tentative de refresh token...")
        
        try {
          const refreshed = await keycloak.updateToken(5)
          
          if (refreshed && keycloak.token) {
            console.log("✅ Token rafraîchi avec succès")
            localStorage.setItem('keycloak_token', keycloak.token)
            
            // Rejouer la requête originale avec le nouveau token
            error.config.headers.Authorization = `Bearer ${keycloak.token}`
            console.log("🔁 Rejeu de la requête avec nouveau token")
            return apiClient.request(error.config)
          } else {
            console.log("❌ Impossible de rafraîchir le token")
            // Rediriger vers login
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
          }
        } catch (refreshError) {
          console.error("❌ Erreur lors du refresh:", refreshError)
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      }
    } else if (error.request) {
      console.error("📡 Pas de réponse du serveur")
      console.error("📡 Request:", error.request)
    } else {
      console.error("⚙️ Erreur de configuration:", error.message)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient