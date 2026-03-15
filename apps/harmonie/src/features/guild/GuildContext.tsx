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
  guildsLoading: boolean;
  fetchGuilds: () => void;
  membersByGuild: Record<string, MembersCacheEntry>;
  fetchGuildMembers: (guildId: string) => void;
}

const GuildContext = createContext<GuildContextValue>({
  guilds: [],
  guildsLoading: false,
  fetchGuilds: () => {},
  membersByGuild: {},
  fetchGuildMembers: () => {},
});

export const GuildProvider = ({ children }: { children: ReactNode }) => {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [membersByGuild, setMembersByGuild] = useState<Record<string, MembersCacheEntry>>({});
  // Ref mirror of membersByGuild so fetchGuildMembers can read it without being a dep
  const membersByGuildRef = useRef<Record<string, MembersCacheEntry>>({});
  // Track in-flight requests to avoid duplicate fetches
  const fetchingRef = useRef<Set<string>>(new Set());

  membersByGuildRef.current = membersByGuild;

  const fetchGuilds = useCallback(() => {
    setGuildsLoading(true);
    listGuilds()
      .then((data) => setGuilds(data.guilds))
      .catch(() => {})
      .finally(() => setGuildsLoading(false));
  }, []);

  const fetchGuildMembers = useCallback((guildId: string) => {
    const entry = membersByGuildRef.current[guildId];
    const isStale = !entry || Date.now() - entry.fetchedAt > MEMBERS_TTL_MS;
    if (!isStale || fetchingRef.current.has(guildId)) return;
    fetchingRef.current.add(guildId);
    listGuildMembers(guildId)
      .then((data) => {
        setMembersByGuild((prev) => ({
          ...prev,
          [guildId]: { members: data.members, fetchedAt: Date.now() },
        }));
      })
      .catch(() => {})
      .finally(() => {
        fetchingRef.current.delete(guildId);
      });
  }, []);

  useEffect(() => fetchGuilds(), [fetchGuilds]);

  return (
    <GuildContext.Provider
      value={{ guilds, guildsLoading, fetchGuilds, membersByGuild, fetchGuildMembers }}
    >
      {children}
    </GuildContext.Provider>
  );
};

export const useGuilds = () => useContext(GuildContext);

export const useGuildMembers = (guildId: string | undefined) => {
  const { membersByGuild, fetchGuildMembers } = useContext(GuildContext);

  useEffect(() => {
    if (guildId) fetchGuildMembers(guildId);
  }, [guildId, fetchGuildMembers]);

  return guildId ? (membersByGuild[guildId]?.members ?? null) : null;
};
