import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { getAccessToken } from '@/api/authStorage';
import { useAuth } from '@/features/auth/AuthContext';

const HUB_URL = import.meta.env.VITE_WS_BASE_URL as string;

interface RealtimeContextValue {
  connection: HubConnection | null;
}

const RealtimeContext = createContext<RealtimeContextValue>({ connection: null });

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setConnection(null);
      return;
    }

    const hub = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? '',
      })
      .withAutomaticReconnect([2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    let cancelled = false;

    hub
      .start()
      .then(() => {
        if (!cancelled) setConnection(hub);
      })
      .catch((err) => {
        console.error('[Realtime] hub.start() failed:', err);
      });

    return () => {
      cancelled = true;
      setConnection(null);
      if (hub.state !== HubConnectionState.Disconnected) {
        hub.stop();
      }
    };
  }, [isAuthenticated]);

  return <RealtimeContext.Provider value={{ connection }}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => useContext(RealtimeContext);
