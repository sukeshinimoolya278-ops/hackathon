import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Disaster, Camp } from '../types';
import { api } from '../services/api';

interface DisasterContextType {
  activeDisaster: Disaster | null;
  disasters: Disaster[];
  camps: Camp[];
  socket: Socket | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  switchDisaster: (id: string) => Promise<void>;
  notifications: string[];
  clearNotification: (idx: number) => void;
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

export const DisasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDisaster, setActiveDisaster] = useState<Disaster | null>(null);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  const refreshData = async () => {
    try {
      const [disastersList, active, campsList] = await Promise.all([
        api.getDisasters(),
        api.getActiveDisaster(),
        api.getCamps(),
      ]);
      setDisasters(disastersList);
      setActiveDisaster(active);
      setCamps(campsList);
    } catch (err) {
      console.error('Failed to load disaster data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // Connect to Socket.IO
    const newSocket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time updates server');
    });

    newSocket.on('lead:approved', (data: any) => {
      setNotifications(prev => [
        `🎉 VERIFIED SAFE: ${data.personName} officially verified at ${data.campName}!`,
        ...prev.slice(0, 4),
      ]);
      refreshData();
    });

    newSocket.on('camp:updated', (updatedCamp: Camp) => {
      setCamps(prev => prev.map(c => (c.id === updatedCamp.id ? updatedCamp : c)));
    });

    newSocket.on('disaster:switched', (updatedDisaster: Disaster) => {
      setActiveDisaster(updatedDisaster);
      refreshData();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const switchDisaster = async (id: string) => {
    setIsLoading(true);
    try {
      await api.switchActiveDisaster(id);
      await refreshData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearNotification = (idx: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <DisasterContext.Provider
      value={{
        activeDisaster,
        disasters,
        camps,
        socket,
        isLoading,
        refreshData,
        switchDisaster,
        notifications,
        clearNotification,
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
};

export const useDisaster = () => {
  const context = useContext(DisasterContext);
  if (!context) {
    throw new Error('useDisaster must be used within a DisasterProvider');
  }
  return context;
};
