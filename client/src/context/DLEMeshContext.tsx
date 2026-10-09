import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DLEMeshNode,
  DLEMeshPacket,
  OfflineTraceableRoute,
  BreadcrumbPoint,
  Camp,
} from '../types';
import {
  dleMeshEngine,
  DEFAULT_MESH_PEERS,
  generateOfflineTraceableRoute,
} from '../services/dleMeshService';
import { useDisaster } from './DisasterContext';

interface DLEMeshContextType {
  isMeshActive: boolean;
  toggleMeshMode: (active?: boolean) => void;
  localNode: DLEMeshNode;
  peers: DLEMeshNode[];
  packets: DLEMeshPacket[];
  activeRoute: OfflineTraceableRoute | null;
  setActiveRoute: (route: OfflineTraceableRoute | null) => void;
  breadcrumbs: BreadcrumbPoint[];
  isRecordingTrail: boolean;
  toggleRecordingTrail: () => void;
  dropBreadcrumb: (note?: string) => void;
  clearBreadcrumbs: () => void;
  broadcastSOS: (details: { reason: string; priority: string; peopleCount?: number }) => DLEMeshPacket;
  broadcastCheckIn: (details: { fullName: string; phone: string; note: string }) => DLEMeshPacket;
  generateRouteToCamp: (camp: Camp, userCoords?: { latitude: number; longitude: number }) => OfflineTraceableRoute;
}

const DLEMeshContext = createContext<DLEMeshContextType | undefined>(undefined);

export const DLEMeshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeDisaster, camps } = useDisaster();

  // DLE Mesh Mode is ACTIVATED by default as requested
  const [isMeshActive, setIsMeshActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('reunitepath_dle_mesh_active');
    return saved !== null ? saved === 'true' : true; // default active!
  });

  const [localNode, setLocalNode] = useState<DLEMeshNode>(() => dleMeshEngine.getLocalNode());
  const [peers, setPeers] = useState<DLEMeshNode[]>(DEFAULT_MESH_PEERS);
  const [packets, setPackets] = useState<DLEMeshPacket[]>(() => dleMeshEngine.getStoredPackets());
  const [activeRoute, setActiveRoute] = useState<OfflineTraceableRoute | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbPoint[]>(() => dleMeshEngine.getBreadcrumbs());
  const [isRecordingTrail, setIsRecordingTrail] = useState<boolean>(false);

  // Keep packets updated via event listener
  useEffect(() => {
    const unsubscribe = dleMeshEngine.onPacketReceived((incomingPacket) => {
      setPackets((prev) => {
        const idx = prev.findIndex((p) => p.id === incomingPacket.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = incomingPacket;
          return next;
        }
        return [incomingPacket, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync breadcrumbs trail when recording is active
  useEffect(() => {
    if (!isRecordingTrail) return;

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const pt = dleMeshEngine.addBreadcrumb(
              pos.coords.latitude,
              pos.coords.longitude,
              `GPS Breadcrumb (${new Date().toLocaleTimeString()})`
            );
            setBreadcrumbs(dleMeshEngine.getBreadcrumbs());
          },
          () => {
            // Simulated trail movement if device stationary
            const last = breadcrumbs[breadcrumbs.length - 1];
            const baseLat = last ? last.latitude : localNode.latitude;
            const baseLng = last ? last.longitude : localNode.longitude;
            const driftLat = baseLat + (Math.random() - 0.5) * 0.0004;
            const driftLng = baseLng + (Math.random() - 0.5) * 0.0004;
            dleMeshEngine.addBreadcrumb(driftLat, driftLng, `P2P Mesh Breadcrumb Step`);
            setBreadcrumbs(dleMeshEngine.getBreadcrumbs());
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isRecordingTrail, breadcrumbs, localNode]);

  // Auto-generate initial offline evacuation route to closest camp if disaster exists
  useEffect(() => {
    if (activeDisaster && camps.length > 0 && !activeRoute) {
      const closestCamp = camps[0];
      const route = generateOfflineTraceableRoute(
        {
          latitude: activeDisaster.latitude + 0.015,
          longitude: activeDisaster.longitude - 0.012,
          name: 'Disaster Evacuation Zone',
        },
        {
          latitude: closestCamp.latitude,
          longitude: closestCamp.longitude,
          campName: closestCamp.name,
          campId: closestCamp.id,
        },
        {
          latitude: activeDisaster.latitude,
          longitude: activeDisaster.longitude,
          radiusMeters: 4000,
        }
      );
      setActiveRoute(route);
    }
  }, [activeDisaster, camps]);

  const toggleMeshMode = (active?: boolean) => {
    const nextState = active !== undefined ? active : !isMeshActive;
    setIsMeshActive(nextState);
    localStorage.setItem('reunitepath_dle_mesh_active', String(nextState));
  };

  const dropBreadcrumb = (note?: string) => {
    const pt = dleMeshEngine.addBreadcrumb(localNode.latitude, localNode.longitude, note);
    setBreadcrumbs(dleMeshEngine.getBreadcrumbs());
  };

  const clearBreadcrumbs = () => {
    dleMeshEngine.clearBreadcrumbs();
    setBreadcrumbs([]);
  };

  const toggleRecordingTrail = () => {
    if (!isRecordingTrail) {
      // Drop first point immediately
      dropBreadcrumb('Trail Start Checkpoint');
    }
    setIsRecordingTrail(!isRecordingTrail);
  };

  const broadcastSOS = (details: { reason: string; priority: string; peopleCount?: number }) => {
    const packet = dleMeshEngine.broadcastPacket('SOS_BEACON', {
      ...details,
      coordinates: {
        latitude: localNode.latitude,
        longitude: localNode.longitude,
      },
      sentAtOffline: new Date().toISOString(),
    });
    setPackets(dleMeshEngine.getStoredPackets());
    return packet;
  };

  const broadcastCheckIn = (details: { fullName: string; phone: string; note: string }) => {
    const packet = dleMeshEngine.broadcastPacket('SAFE_CHECKIN', {
      ...details,
      coordinates: {
        latitude: localNode.latitude,
        longitude: localNode.longitude,
      },
      sentAtOffline: new Date().toISOString(),
    });
    setPackets(dleMeshEngine.getStoredPackets());
    return packet;
  };

  const generateRouteToCamp = (
    camp: Camp,
    userCoords?: { latitude: number; longitude: number }
  ): OfflineTraceableRoute => {
    const originCoords = userCoords || {
      latitude: activeDisaster ? activeDisaster.latitude + 0.015 : 13.0827,
      longitude: activeDisaster ? activeDisaster.longitude - 0.012 : 80.2707,
    };

    const hazardCoords = activeDisaster
      ? {
          latitude: activeDisaster.latitude,
          longitude: activeDisaster.longitude,
          radiusMeters: 4000,
        }
      : undefined;

    const route = generateOfflineTraceableRoute(
      {
        latitude: originCoords.latitude,
        longitude: originCoords.longitude,
        name: userCoords ? 'Your Current Location' : 'Evacuation Assembly Point',
      },
      {
        latitude: camp.latitude,
        longitude: camp.longitude,
        campName: camp.name,
        campId: camp.id,
      },
      hazardCoords
    );

    setActiveRoute(route);
    return route;
  };

  return (
    <DLEMeshContext.Provider
      value={{
        isMeshActive,
        toggleMeshMode,
        localNode,
        peers,
        packets,
        activeRoute,
        setActiveRoute,
        breadcrumbs,
        isRecordingTrail,
        toggleRecordingTrail,
        dropBreadcrumb,
        clearBreadcrumbs,
        broadcastSOS,
        broadcastCheckIn,
        generateRouteToCamp,
      }}
    >
      {children}
    </DLEMeshContext.Provider>
  );
};

export const useDLEMesh = () => {
  const context = useContext(DLEMeshContext);
  if (!context) {
    throw new Error('useDLEMesh must be used within a DLEMeshProvider');
  }
  return context;
};
