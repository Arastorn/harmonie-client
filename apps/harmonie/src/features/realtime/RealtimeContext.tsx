import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { getAccessToken } from '@/api/authStorage';
import { useAuth } from '@/features/auth/AuthContext';
import { REALTIME_SERVER_EVENTS } from './constants';

const HUB_URL = import.meta.env.VITE_WS_BASE_URL as string;

interface RealtimeContextValue {
  connection: HubConnection | null;
  isReady: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({ connection: null, isReady: false });

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setConnection(null);
      setIsReady(false);
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
    const handleReady = () => {
      if (!cancelled) setIsReady(true);
    };

    hub.on(REALTIME_SERVER_EVENTS.ready, handleReady);

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
      setIsReady(false);
      hub.off(REALTIME_SERVER_EVENTS.ready, handleReady);
      if (hub.state !== HubConnectionState.Disconnected) {
        hub.stop();
      }
    };
  }, [isAuthenticated]);

  return (
    <RealtimeContext.Provider value={{ connection, isReady }}>{children}</RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
