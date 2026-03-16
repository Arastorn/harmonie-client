import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { listChannels, reorderChannels } from '@/api/guilds';
import type { Channel } from '@/types/guild';

// Internal state: channels are always tagged with the guildId they belong to.
// This prevents stale data from a previous guild leaking to a new one during
// the render cycle before the fetch effect has had a chance to reset.
interface ChannelState {
  guildId: string;
  channels: Channel[];
}

interface ChannelContextValue {
  // null while loading OR while the loaded data belongs to a different guild
  channels: Channel[] | null;
  addChannel: (channel: Channel) => void;
  updateChannel: (updated: Channel) => void;
  removeChannel: (channelId: string) => void;
  applyReorder: (guildId: string, reordered: Channel[]) => Promise<void>;
}

const ChannelContext = createContext<ChannelContextValue>({
  channels: null,
  addChannel: () => {},
  updateChannel: () => {},
  removeChannel: () => {},
  applyReorder: async () => {},
});

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const { guildId } = useParams<{ guildId: string }>();
  const [state, setState] = useState<ChannelState | null>(null);

  const fetch = useCallback(() => {
    if (!guildId) {
      setState(null);
      return;
    }
    setState(null);
    listChannels(guildId)
      .then((data) => setState({ guildId, channels: data.channels }))
      .catch(() => setState({ guildId, channels: [] }));
  }, [guildId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addChannel = (channel: Channel) =>
    setState((prev) => (prev ? { ...prev, channels: [...prev.channels, channel] } : null));

  const updateChannel = (updated: Channel) =>
    setState((prev) =>
      prev
        ? {
            ...prev,
            channels: prev.channels.map((c) => (c.channelId === updated.channelId ? updated : c)),
          }
        : null
    );

  const removeChannel = (channelId: string) =>
    setState((prev) =>
      prev ? { ...prev, channels: prev.channels.filter((c) => c.channelId !== channelId) } : null
    );

  const applyReorder = async (gId: string, reordered: Channel[]) => {
    const previous = state;
    setState((prev) => (prev ? { ...prev, channels: reordered } : null));
    try {
      const result = await reorderChannels(gId, {
        channels: reordered.map((c) => ({ channelId: c.channelId, position: c.position })),
      });
      setState((prev) => (prev ? { ...prev, channels: result.channels } : null));
    } catch {
      setState(previous);
    }
  };

  const channels = guildId && state?.guildId === guildId ? state.channels : null;

  return (
    <ChannelContext.Provider
      value={{ channels, addChannel, updateChannel, removeChannel, applyReorder }}
    >
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannels = () => useContext(ChannelContext);
