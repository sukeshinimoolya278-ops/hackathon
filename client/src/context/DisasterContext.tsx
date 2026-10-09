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

const FALLBACK_DISASTER: Disaster = {
  id: 'disaster-1',
  name: 'Wayanad Landslide Relief Sector',
  description: 'Massive landslide and flooding in Meppadi & Chooralmala region.',
  location: 'Meppadi & Chooralmala',
  state: 'Kerala',
  latitude: 11.5544,
  longitude: 76.1322,
  alertLevel: 'RED_ALERT',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const FALLBACK_CAMPS: Camp[] = [
  {
    id: 'camp-1',
    disasterId: 'disaster-1',
    name: 'St. Joseph Higher Secondary Relief Camp',
    location: 'Meppadi Town, Wayanad',
    latitude: 11.5512,
    longitude: 76.1289,
    capacity: 500,
    currentOccupancy: 342,
    status: 'OPEN',
    contactPerson: 'Father Mathew Varghese',
    contactPhone: '+91 94471 23456',
    needs: 'Blankets, Infant formula, First-aid kits',
  },
  {
    id: 'camp-2',
    disasterId: 'disaster-1',
    name: 'Chooralmala Govt UP School Camp',
    location: 'Chooralmala Valley',
    latitude: 11.5388,
    longitude: 76.1554,
    capacity: 350,
    currentOccupancy: 290,
    status: 'NEAR_CAPACITY',
    contactPerson: 'Sujatha Pillai (Nodal Officer)',
    contactPhone: '+91 98460 78901',
    needs: 'Drinking water canisters, Solar lamps',
  },
  {
    id: 'camp-3',
    disasterId: 'disaster-1',
    name: 'Vythiri Community Hall Emergency Shelter',
    location: 'Vythiri Bypass, Wayanad',
    latitude: 11.5589,
    longitude: 76.0421,
    capacity: 450,
    currentOccupancy: 215,
    status: 'OPEN',
    contactPerson: 'K. Ramachandran (Revenue Inspector)',
    contactPhone: '+91 94955 43210',
    needs: 'Medicines (Insulin, ORS), Dry rations',
  },
];

export const DisasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDisaster, setActiveDisaster] = useState<Disaster | null>(FALLBACK_DISASTER);
  const [disasters, setDisasters] = useState<Disaster[]>([FALLBACK_DISASTER]);
  const [camps, setCamps] = useState<Camp[]>(FALLBACK_CAMPS);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const refreshData = async () => {
    try {
      const [disastersList, active, campsList] = await Promise.all([
        api.getDisasters().catch(() => null),
        api.getActiveDisaster().catch(() => null),
        api.getCamps().catch(() => null),
      ]);
      if (Array.isArray(disastersList) && disastersList.length > 0) {
        setDisasters(disastersList);
      }
      if (active && typeof active === 'object' && active.id) {
        setActiveDisaster(active);
      }
      if (Array.isArray(campsList) && campsList.length > 0) {
        setCamps(campsList);
      }
    } catch (err) {
      console.warn('Backend unavailable, using resilient fallback data:', err);
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
