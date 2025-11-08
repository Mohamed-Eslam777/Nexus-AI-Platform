import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Effect to handle socket connection/disconnection based on authentication
  useEffect(() => {
    // Check if user is authenticated
    const checkAuthAndConnect = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // If no token, ensure socket is disconnected
        if (socketRef.current) {
          console.log('[SOCKET] No token found, disconnecting socket');
          socketRef.current.emit('leave-user-room', socketRef.current.userId);
          socketRef.current.disconnect();
          setSocket(null);
          setIsConnected(false);
          socketRef.current = null;
        }
        return;
      }

      // If socket already exists and connected, don't reconnect
      if (socketRef.current && socketRef.current.connected) {
        return;
      }

      try {
        // Decode token to get user data
        const decoded = jwtDecode(token);
        const user = decoded.user;

        if (!user || !user.id) {
          console.error('[SOCKET] Invalid token: user data missing');
          return;
        }

        // Get socket URL from environment variable or use default
        const socketUrl = process.env.REACT_APP_SOCKET_URL || 
          (process.env.NODE_ENV === 'production' 
            ? window.location.origin 
            : 'http://localhost:5000');

        console.log(`[SOCKET] Initializing connection to: ${socketUrl}`);

        // Initialize socket connection
        // Force WebSocket transport to prevent connection drop/closure errors
        const newSocket = io(socketUrl, {
          transports: ['websocket'], // Use only WebSocket transport
          upgrade: false, // Disable transport upgrade to prevent fallback to polling
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          reconnectionDelayMax: 5000,
        });

        socketRef.current = newSocket;

        // Store userId for cleanup
        newSocket.userId = user.id;

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log(`[SOCKET] Connected with ID: ${newSocket.id}`);
          setIsConnected(true);

          // Join user's private room immediately after connection
          newSocket.emit('join-user-room', user.id);
          console.log(`[SOCKET] Joined user room: user-${user.id}`);
        });

        newSocket.on('disconnect', (reason) => {
          console.log(`[SOCKET] Disconnected: ${reason}`);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('[SOCKET] Connection error:', error);
          setIsConnected(false);
        });

        // Notification listener
        newSocket.on('notification', (data) => {
          console.log('[SOCKET] Notification received:', data);

          // Add notification to state
          const newNotification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...data,
            read: false,
            createdAt: new Date().toISOString(),
          };

          setNotifications((prev) => [newNotification, ...prev]);

          // Show toast notification based on type
          const notificationType = data.type || 'info';
          
          if (notificationType.includes('APPROVED') || notificationType === 'PAYOUT_COMPLETED') {
            toast.success(data.message || 'Notification received', {
              position: 'top-right',
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          } else if (notificationType.includes('REJECTED') || notificationType === 'PAYOUT_REJECTED') {
            toast.error(data.message || 'Notification received', {
              position: 'top-right',
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          } else {
            toast.info(data.message || 'Notification received', {
              position: 'top-right',
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }
        });

        setSocket(newSocket);

      } catch (error) {
        console.error('[SOCKET] Error decoding token or initializing socket:', error);
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setSocket(null);
        setIsConnected(false);
      }
    };

    // Initial check
    checkAuthAndConnect();

    // Listen for storage changes (token added/removed)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        console.log('[SOCKET] Token changed in storage, reconnecting...');
        checkAuthAndConnect();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically (as fallback for same-tab changes)
    const intervalId = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      const hasToken = !!currentToken;
      const isConnected = socketRef.current?.connected;

      if (hasToken && !isConnected) {
        checkAuthAndConnect();
      } else if (!hasToken && isConnected) {
        checkAuthAndConnect();
      }
    }, 2000); // Check every 2 seconds

    // Cleanup function
    return () => {
      console.log('[SOCKET] Cleaning up socket connection');
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      
      if (socketRef.current) {
        // Leave user room before disconnecting
        if (socketRef.current.userId) {
          socketRef.current.emit('leave-user-room', socketRef.current.userId);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, []); // Empty dependency array - will check on mount and cleanup on unmount

  // Function to mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Function to mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  };

  // Function to remove a notification
  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
  };

  // Function to clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Get unread notifications count
  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const value = {
    socket,
    notifications,
    isConnected,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

