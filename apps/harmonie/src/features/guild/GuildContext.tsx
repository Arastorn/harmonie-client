import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { listGuilds, listGuildMembers } from '@/api/guilds';
import type { Guild, GuildMember } from '@/types/guild';

const MEMBERS_TTL_MS = 5 * 60 * 1000;

interface MembersCacheEntry {
  members: GuildMember[];
  fetchedAt: number;
}

interface GuildContextValue {
  guilds: Guild[];
  isLoading: boolean;
  refresh: () => void;
  membersCache: Record<string, MembersCacheEntry>;
  fetchMembers: (guildId: string) => void;
}

const GuildContext = createContext<GuildContextValue>({
  guilds: [],
  isLoading: false,
  refresh: () => {},
  membersCache: {},
  fetchMembers: () => {},
});

export const GuildProvider = ({ children }: { children: ReactNode }) => {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [membersCache, setMembersCache] = useState<Record<string, MembersCacheEntry>>({});
  // Ref mirror of membersCache so fetchMembers can read it without being a dep
  const membersCacheRef = useRef<Record<string, MembersCacheEntry>>({});
  // Track in-flight requests to avoid duplicate fetches
  const fetchingRef = useRef<Set<string>>(new Set());

  membersCacheRef.current = membersCache;

  const refresh = useCallback(() => {
    setIsLoading(true);
    listGuilds()
      .then((data) => setGuilds(data.guilds))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const fetchMembers = useCallback((guildId: string) => {
    const entry = membersCacheRef.current[guildId];
    const isStale = !entry || Date.now() - entry.fetchedAt > MEMBERS_TTL_MS;
    if (!isStale || fetchingRef.current.has(guildId)) return;
    fetchingRef.current.add(guildId);
    listGuildMembers(guildId)
      .then((data) => {
        setMembersCache((prev) => ({
          ...prev,
          [guildId]: { members: data.members, fetchedAt: Date.now() },
        }));
      })
      .catch(() => {})
      .finally(() => {
        fetchingRef.current.delete(guildId);
      });
  }, []);

  useEffect(() => refresh(), [refresh]);

  return (
    <GuildContext.Provider value={{ guilds, isLoading, refresh, membersCache, fetchMembers }}>
      {children}
    </GuildContext.Provider>
  );
};

export const useGuilds = () => useContext(GuildContext);

export const useGuildMembers = (guildId: string | undefined) => {
  const { membersCache, fetchMembers } = useContext(GuildContext);

  useEffect(() => {
    if (guildId) fetchMembers(guildId);
  }, [guildId, fetchMembers]);

  return guildId ? (membersCache[guildId]?.members ?? null) : null;
};
