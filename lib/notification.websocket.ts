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
}

/**
 * WebSocket client for receiving real-time notifications
 */
export class NotificationWebSocketClient {
    private client: Client | null = null;
    private isConnected: boolean = false;

    /**
     * Connect to the WebSocket server and subscribe to doctor notifications
     * @param doctorId - The ID of the doctor receiving notifications
     * @param onNotification - Callback function when a notification is received
     */
    connect(doctorId: string, onNotification: (notification: NotificationMessage) => void): void {
        if (this.isConnected) {
            console.warn('WebSocket is already connected');
            return;
        }

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

                // Subscribe to doctor-specific notifications
                const topic = `/topic/doctor/${doctorId}/notifications`;
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
