import React, { createContext, useContext, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface NotificationContextType {
  // Can add methods here later if needed, like sending messages back
}

const NotificationContext = createContext<NotificationContextType>({});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to websocket
    const wsUrl = `ws://localhost:8000/api/v1/ws/notifications?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to notification websocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_PLAN_APPROVED') {
          // Toast the notification
          toast(data.message, {
            duration: 10000,
            icon: '🔔',
            style: {
              background: '#06b6d4',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
            },
          });
        }
      } catch (e) {
        console.error('Error parsing notification:', e);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from notification websocket');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
