import { useState, useEffect, useCallback } from "react";
import socketService from "../services/socket";

export const useSocket = (
  serverUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001"
) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to socket server
    try {
      const socketInstance = socketService.connect(serverUrl);
      setSocket(socketInstance);

      // Listen for connection status changes
      socketInstance.on("connect", () => {
        setConnected(true);
        setError(null);
      });

      socketInstance.on("disconnect", () => {
        setConnected(false);
      });

      socketInstance.on("connect_error", (err) => {
        setError(err.message);
        setConnected(false);
      });
    } catch (err) {
      setError(err.message);
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      setConnected(false);
      setSocket(null);
    };
  }, [serverUrl]);

  const joinLinha = useCallback((linhaId) => {
    socketService.joinLinha(linhaId);
  }, []);

  const leaveLinha = useCallback((linhaId) => {
    socketService.leaveLinha(linhaId);
  }, []);

  const ping = useCallback(() => {
    socketService.ping();
  }, []);

  const emit = useCallback((event, data) => {
    socketService.emit(event, data);
  }, []);

  const on = useCallback((event, callback) => {
    socketService.on(event, callback);
  }, []);

  const off = useCallback((event) => {
    socketService.off(event);
  }, []);

  return {
    connected,
    error,
    socket,
    joinLinha,
    leaveLinha,
    ping,
    emit,
    on,
    off,
    isConnected: socketService.isConnected(),
  };
};
