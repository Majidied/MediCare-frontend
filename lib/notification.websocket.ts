import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface NotificationMessage {
    id: number;
    recipientId: number;
    type: string;
    title: string;
    content: string;
    status: string;
    creationDate: string;
    readDate?: string;
    patientId?: number;
    appointmentId?: number;
    consultationId?: number;
}

/**
 * WebSocket client for receiving real-time notifications
 */
export class NotificationWebSocketClient {
    private client: Client | null = null;
    private isConnected: boolean = false;
    private currentRole: string | null = null;

    /**
     * Connect to the WebSocket server and subscribe to user notifications
     * @param userId - The ID of the user (doctor or secretary) receiving notifications
     * @param onNotification - Callback function when a notification is received
     * @param role - The role of the user ('medecin' or 'secretaire')
     */
    connect(userId: string, onNotification: (notification: NotificationMessage) => void, role?: string): void {
        if (this.isConnected) {
            console.warn('WebSocket is already connected');
            return;
        }

        this.currentRole = role || 'medecin';

        // Create SockJS instance
        // Use notification service port (8098) or gateway if configured
        const wsUrl = process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL || 'http://localhost:8098/ws-notifications';
        const socket = new SockJS(wsUrl);

        // Create STOMP client
        this.client = new Client({
            webSocketFactory: () => socket as any,

            debug: (str) => {
                console.log('STOMP Debug:', str);
            },

            reconnectDelay: 5000, // Reconnect after 5 seconds if disconnected
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log('WebSocket connected successfully');
                this.isConnected = true;

                // Subscribe to user-specific notifications based on role
                // For doctors: /topic/doctor/{id}/notifications
                // For secretaries: /topic/user/{id}/notifications (or same as doctor topic)
                const topic = `/topic/doctor/${userId}/notifications`;

                this.client?.subscribe(topic, (message) => {
                    try {
                        const notification = JSON.parse(message.body) as NotificationMessage;
                        console.log('Received notification:', notification);
                        onNotification(notification);
                    } catch (error) {
                        console.error('Error parsing notification:', error);
                    }
                });

                console.log(`Subscribed to ${topic}`);

                // Also subscribe to general clinic notifications if secretary
                if (this.currentRole === 'secretaire') {
                    const clinicTopic = `/topic/clinic/notifications`;
                    this.client?.subscribe(clinicTopic, (message) => {
                        try {
                            const notification = JSON.parse(message.body) as NotificationMessage;
                            console.log('Received clinic notification:', notification);
                            onNotification(notification);
                        } catch (error) {
                            console.error('Error parsing clinic notification:', error);
                        }
                    });
                    console.log(`Also subscribed to ${clinicTopic}`);
                }
            },

            onDisconnect: () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
            },

            onStompError: (frame) => {
                console.error('STOMP error:', frame.headers['message']);
                console.error('Details:', frame.body);
                this.isConnected = false;
            },
        });

        // Activate the client
        this.client.activate();
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void {
        if (this.client) {
            this.client.deactivate();
            this.isConnected = false;
            console.log('WebSocket disconnected');
        }
    }

    /**
     * Check if the client is connected
     */
    isWebSocketConnected(): boolean {
        return this.isConnected;
    }
}

// Singleton instance for the application
let notificationWebSocket: NotificationWebSocketClient | null = null;

/**
 * Get or create the notification WebSocket client instance
 */
export function getNotificationWebSocket(): NotificationWebSocketClient {
    if (!notificationWebSocket) {
        notificationWebSocket = new NotificationWebSocketClient();
    }
    return notificationWebSocket;
}
