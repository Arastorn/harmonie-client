import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface AudioOutputDevice {
  deviceId: string;
  label: string;
}

interface AudioOutputContextValue {
  devices: AudioOutputDevice[];
  selectedDeviceId: string;
  selectDevice: (deviceId: string) => void;
  applySinkId: (el: HTMLAudioElement) => void;
  needsPermission: boolean;
  requestPermission: () => Promise<void>;
  muted: boolean;
  toggleMute: () => void;
}

const AudioOutputContext = createContext<AudioOutputContextValue | null>(null);

const STORAGE_KEY = 'harmonie:audioOutputDeviceId';
const DEFAULT_DEVICE_ID = 'default';

export const AudioOutputProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<AudioOutputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DEVICE_ID
  );
  const [needsPermission, setNeedsPermission] = useState(false);
  const [muted, setMuted] = useState(false);
  const selectedDeviceIdRef = useRef(selectedDeviceId);

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const outputDevices = allDevices.filter((d) => d.kind === 'audiooutput');
      const uniqueOutputDevices = Array.from(
        new Map(outputDevices.map((device) => [device.deviceId, device])).values()
      );

      const hasLabels = uniqueOutputDevices.some((d) => d.label !== '');

      const mapped: AudioOutputDevice[] = uniqueOutputDevices.map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || (d.deviceId === DEFAULT_DEVICE_ID ? '' : `Output ${i + 1}`),
      }));

      if (!mapped.find((d) => d.deviceId === DEFAULT_DEVICE_ID)) {
        mapped.unshift({ deviceId: DEFAULT_DEVICE_ID, label: '' });
      }

      setDevices(mapped);
      setNeedsPermission(!hasLabels);
    } catch {
      // mediaDevices not available (e.g. insecure context)
    }
  }, []);

  useEffect(() => {
    void enumerateDevices();
    navigator.mediaDevices?.addEventListener('devicechange', enumerateDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', enumerateDevices);
    };
  }, [enumerateDevices]);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  const applyToAllElements = useCallback((deviceId: string) => {
    document.querySelectorAll<HTMLAudioElement>('audio').forEach((el) => {
      if ('setSinkId' in el) {
        void (el as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(
          deviceId
        );
      }
    });
  }, []);

  const selectDevice = useCallback(
    (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      localStorage.setItem(STORAGE_KEY, deviceId);
      applyToAllElements(deviceId);
    },
    [applyToAllElements]
  );

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      await enumerateDevices();
    } catch {
      // User denied — leave needsPermission as true
    }
  }, [enumerateDevices]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      document.querySelectorAll<HTMLAudioElement>('audio').forEach((el) => {
        el.muted = next;
      });
      return next;
    });
  }, []);

  const applySinkId = useCallback((el: HTMLAudioElement) => {
    const deviceId = selectedDeviceIdRef.current;
    if ('setSinkId' in el && deviceId !== DEFAULT_DEVICE_ID) {
      void (el as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(
        deviceId
      );
    }
  }, []);

  return (
    <AudioOutputContext.Provider
      value={{
        devices,
        selectedDeviceId,
        selectDevice,
        applySinkId,
        needsPermission,
        requestPermission,
        muted,
        toggleMute,
      }}
    >
      {children}
    </AudioOutputContext.Provider>
  );
};

export const useAudioOutput = (): AudioOutputContextValue => {
  const ctx = useContext(AudioOutputContext);
  if (!ctx) throw new Error('useAudioOutput must be used inside AudioOutputProvider');
  return ctx;
};
