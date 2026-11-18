"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback, useState } from 'react'
import { notificationApi, notificationHelpers, type Notification, type NotificationResponse } from '@/api/notification.api'
import { getNotificationWebSocket, type NotificationMessage } from '@/lib/notification.websocket'
import { useAuth } from '@/lib/auth-context'
import { useCurrentUser } from '@/hooks/use-user'
import { useToast } from '@/hooks/use-toast'

// Billing notification interface (local state for doctor-secretary communication)
export interface BillingNotification {
    id: string
    type: 'billing'
    consultationId: number
    patientId: number
    patientName: string
    patientAge?: number
    consultationDate: string
    motif: string
    diagnostic?: string
    traitement?: string
    notes?: string
    actes?: any[]
    status: 'pending' | 'processed'
    sentBy: string
    sentAt: string
}

// Query Keys
export const notificationKeys = {
    all: ['notifications'] as const,
    byRecipient: (recipientId: number) => [...notificationKeys.all, 'recipient', recipientId] as const,
    unread: (recipientId: number) => [...notificationKeys.all, 'unread', recipientId] as const,
}

// Storage key for billing notifications (persisted in localStorage)
const BILLING_NOTIFICATIONS_KEY = 'cabinetx_billing_notifications'

// Helper to get billing notifications from localStorage
function getBillingNotificationsFromStorage(): BillingNotification[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(BILLING_NOTIFICATIONS_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

// Helper to save billing notifications to localStorage
function saveBillingNotificationsToStorage(notifications: BillingNotification[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(BILLING_NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

/**
 * Main hook for notifications (both REST API and WebSocket)
 * Replaces NotificationsContext with React Query
 */
export function useNotifications() {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const wsConnectedRef = useRef(false)
    
    // Get the actual database user ID from user-service (not Keycloak sub)
    const { data: userDetails } = useCurrentUser(user?.email)
    const userId = userDetails?.id ?? null
    const userRole = user?.role

    // Local state for billing notifications (doctor -> secretary communication)
    const [billingNotifications, setBillingNotifications] = useState<BillingNotification[]>([])

    // Initialize billing notifications from localStorage
    useEffect(() => {
        setBillingNotifications(getBillingNotificationsFromStorage())
    }, [])

    // Initialize audio element for notification sound
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification-sound.mp3')
        }
    }, [])

    // Fetch notifications from backend using React Query
    const {
        data: notifications = [],
        isLoading,
        refetch: refreshNotifications,
    } = useQuery({
        queryKey: notificationKeys.byRecipient(userId ?? 0),
        queryFn: async () => {
            if (!userId) return []
            console.log('[useNotifications] Fetching notifications for userId:', userId)
            const response = await notificationApi.getByRecipient(userId)
            let frontendNotifications = response.data.map(notificationHelpers.toFrontend)
            
            // Deduplicate by ID (in case of any duplicates from backend)
            const uniqueNotifications = new Map<string, Notification>()
            frontendNotifications.forEach(notif => {
                if (!uniqueNotifications.has(notif.id)) {
                    uniqueNotifications.set(notif.id, notif)
                }
            })
            frontendNotifications = Array.from(uniqueNotifications.values())
            
            // Sort by creation date (newest first)
            frontendNotifications.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            console.log('[useNotifications] Fetched notifications:', frontendNotifications.length)
            return frontendNotifications
        },
        enabled: !!userId,
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
    })

    // WebSocket connection for real-time notifications (doctors AND secretaries)
    useEffect(() => {
        console.log('[useNotifications] WebSocket setup check - userId:', userId, 'role:', userRole)
        
        if (!userId) {
            console.log('[useNotifications] Skipping WebSocket - no userId')
            return
        }
        
        // Enable WebSocket for both doctors (medecin) and secretaries (secretaire)
        if (userRole !== 'medecin' && userRole !== 'secretaire') {
            console.log('[useNotifications] Skipping WebSocket - role is not medecin or secretaire, got:', userRole)
            return
        }

        if (wsConnectedRef.current) {
            console.log('[useNotifications] WebSocket already connected')
            return
        }

        console.log('[useNotifications] Initializing WebSocket for user ID:', userId, 'role:', userRole)
        const wsClient = getNotificationWebSocket()

        // Handle incoming notifications
        const handleNotification = (notification: NotificationMessage) => {
            console.log('[useNotifications] Received WebSocket notification:', notification)

            // Convert to frontend format
            const frontendNotification: Notification = {
                id: notification.id.toString(),
                recipientId: notification.recipientId,
                type: notification.type as any,
                title: notification.title,
                content: notification.content,
                status: notification.status === 'PENDING' ? 'pending' : 'read',
                createdAt: notification.creationDate,
                readAt: notification.readDate,
                patientId: notification.patientId,
                appointmentId: notification.appointmentId,
                consultationId: notification.consultationId,
            }

            // Add to query cache only if it doesn't already exist (prevent duplicates)
            queryClient.setQueryData(
                notificationKeys.byRecipient(userId),
                (old: Notification[] = []) => {
                    // Check if notification already exists
                    const exists = old.some(n => n.id === frontendNotification.id)
                    if (exists) {
                        console.log('[useNotifications] Notification already exists, skipping duplicate:', notification.id)
                        return old
                    }
                    return [frontendNotification, ...old]
                }
            )

            // Play sound alert
            if (audioRef.current) {
                audioRef.current.play().catch(err => 
                    console.error('[useNotifications] Failed to play sound:', err)
                )
            }

            // Show toast notification
            toast({
                title: notification.title,
                description: notification.content,
                duration: 10000, // 10 seconds
            })
            
            // For secretary: also refresh queue and appointments on notification
            if (userRole === 'secretaire') {
                // Invalidate queue and appointments to get fresh data
                queryClient.invalidateQueries({ queryKey: ['queue'] })
                queryClient.invalidateQueries({ queryKey: ['appointments'] })
            }
        }

        // Connect to WebSocket with role for proper topic subscription
        wsClient.connect(String(userId), handleNotification, userRole || undefined)
        wsConnectedRef.current = true
        console.log('[useNotifications] WebSocket connection initiated for user ID:', userId, 'role:', userRole)

        // Cleanup on unmount
        return () => {
            wsClient.disconnect()
            wsConnectedRef.current = false
            console.log('[useNotifications] WebSocket disconnected')
        }
    }, [userId, userRole, queryClient, toast])

    // Mark notification as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await notificationApi.markAsRead(Number(id))
            return id
        },
        onSuccess: (id) => {
            queryClient.setQueryData(
                notificationKeys.byRecipient(userId ?? 0),
                (old: Notification[] = []) =>
                    old.map((notif) =>
                        notif.id === id
                            ? { ...notif, status: 'read' as const, readAt: new Date().toISOString() }
                            : notif
                    )
            )
        },
        onError: (error) => {
            console.error('[useNotifications] Failed to mark notification as read:', error)
        },
    })

    // Mark notification as read
    const markAsRead = useCallback(async (id: string) => {
        await markAsReadMutation.mutateAsync(id)
    }, [markAsReadMutation])

    // Add notification manually (e.g., from WebSocket)
    const addNotification = useCallback((notification: Notification) => {
        queryClient.setQueryData(
            notificationKeys.byRecipient(userId ?? 0),
            (old: Notification[] = []) => [notification, ...old]
        )
    }, [queryClient, userId])

    // === Billing notifications (local state for doctor-secretary communication) ===

    // Add billing notification (called by doctor when consultation ends)
    const addBillingNotification = useCallback((notification: BillingNotification) => {
        setBillingNotifications(prev => {
            const updated = [notification, ...prev]
            saveBillingNotificationsToStorage(updated)
            return updated
        })
    }, [])

    // Mark billing notification as processed (called by secretary)
    const markBillingAsProcessed = useCallback((id: string) => {
        setBillingNotifications(prev => {
            const updated = prev.map(n => 
                n.id === id ? { ...n, status: 'processed' as const } : n
            )
            saveBillingNotificationsToStorage(updated)
            return updated
        })
    }, [])

    // Computed values
    const unreadCount = notifications.filter((n) => n.status === 'pending').length
    const unreadBillingCount = notifications.filter((n) => n.type === 'BILLING_READY' && n.status === 'pending').length

    return {
        // Notifications from backend
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        refreshNotifications,
        addNotification,
        
        // Billing notifications (local state)
        billingNotifications,
        unreadBillingCount,
        addBillingNotification,
        markBillingAsProcessed,
    }
}

/**
 * Hook to fetch notifications for a specific recipient
 */
export function useNotificationsByRecipient(recipientId: number) {
    return useQuery({
        queryKey: notificationKeys.byRecipient(recipientId),
        queryFn: async () => {
            const response = await notificationApi.getByRecipient(recipientId)
            return response.data.map(notificationHelpers.toFrontend)
        },
        enabled: recipientId > 0,
    })
}

/**
 * Hook to fetch unread notifications
 */
export function useUnreadNotifications(recipientId: number) {
    return useQuery({
        queryKey: notificationKeys.unread(recipientId),
        queryFn: async () => {
            const response = await notificationApi.getUnread(recipientId)
            return response.data.map(notificationHelpers.toFrontend)
        },
        enabled: recipientId > 0,
    })
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (notificationId: number) => notificationApi.markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all })
        },
    })
}
