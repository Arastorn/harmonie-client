export const hasRelayServer = (iceServers: RTCIceServer[]): boolean => {
  return iceServers
    .flatMap((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]))
    .some((url) => url.startsWith('turn:') || url.startsWith('turns:'));
};

export const getJoinErrorKey = (error: unknown): string => {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    message.includes('notallowederror') ||
    message.includes('permission denied') ||
    message.includes('permission dismissed') ||
    message.includes('could not start audio source')
  ) {
    return 'voice.joinErrorMic';
  }

  if (
    message.includes('could not establish pc connection') ||
    message.includes('ice failed') ||
    message.includes('connection timeout')
  ) {
    return 'voice.joinErrorNetwork';
  }

  return 'voice.joinError';
};

export const buildIceServers = (serverIceServers?: RTCIceServer[]): RTCIceServer[] | undefined => {
  if (serverIceServers && serverIceServers.length > 0) return serverIceServers;

  const turnUrls = import.meta.env.VITE_TURN_URLS as string | undefined;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;
  if (!turnUrls) return undefined;

  return [
    {
      urls: turnUrls.split(',').map((u) => u.trim()),
      ...(turnUsername ? { username: turnUsername } : {}),
      ...(turnCredential ? { credential: turnCredential } : {}),
    },
  ];
};
