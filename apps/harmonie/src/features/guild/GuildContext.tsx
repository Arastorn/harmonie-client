import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { listGuilds, listGuildMembers } from '@/api/guilds';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import { useUser } from '@/features/user/UserContext';
import type {
  Guild,
  GuildDeletedEvent,
  GuildMember,
  GuildOwnershipTransferredEvent,
  GuildUpdatedEvent,
  MemberEvent,
  MemberRoleUpdatedEvent,
  UserPresenceChangedEvent,
} from '@/types/guild';

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
  fetchGuildMembers: (guildId: string, force?: boolean) => void;
}

const GuildContext = createContext<GuildContextValue>({
  guilds: [],
  guildsLoading: false,
  fetchGuilds: () => {},
  membersByGuild: {},
  fetchGuildMembers: () => {},
});

export const GuildProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { guildId: currentGuildId } = useParams<{ guildId: string }>();
  const activeGuildId = location.pathname.match(/^\/guilds\/([^/]+)/)?.[1] ?? currentGuildId;
  const { connection } = useRealtime();
  const { user } = useUser();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [membersByGuild, setMembersByGuild] = useState<Record<string, MembersCacheEntry>>({});
  const membersByGuildRef = useRef<Record<string, MembersCacheEntry>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  membersByGuildRef.current = membersByGuild;

  const fetchGuilds = useCallback(() => {
    setGuildsLoading(true);
    listGuilds()
      .then((data) => setGuilds(data.guilds))
      .catch(() => {})
      .finally(() => setGuildsLoading(false));
  }, []);

  const fetchGuildMembers = useCallback((guildId: string, force = false) => {
    const entry = membersByGuildRef.current[guildId];
    const isStale = !entry || Date.now() - entry.fetchedAt > MEMBERS_TTL_MS;
    if ((!isStale && !force) || fetchingRef.current.has(guildId)) return;
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

  useEffect(() => {
    if (!connection) return;

    const removeGuild = (guildId: string) => {
      setGuilds((prev) => prev.filter((guild) => guild.guildId !== guildId));
      setMembersByGuild((prev) => {
        if (!(guildId in prev)) return prev;
        const next = { ...prev };
        delete next[guildId];
        return next;
      });
      if (guildId === activeGuildId) navigate('/conversations', { replace: true });
    };

    const refreshMembersIfCached = (guildId: string) => {
      if (membersByGuildRef.current[guildId]) fetchGuildMembers(guildId, true);
    };

    const handleGuildDeleted = (event: GuildDeletedEvent) => {
      removeGuild(event.guildId);
    };

    const handleYouWereRemoved = (event: GuildDeletedEvent) => {
      removeGuild(event.guildId);
    };

    const handleGuildUpdated = (event: GuildUpdatedEvent) => {
      setGuilds((prev) =>
        prev.map((guild) =>
          guild.guildId === event.guildId
            ? { ...guild, name: event.name, iconFileId: event.iconFileId }
            : guild
        )
      );
    };

    const handleGuildOwnershipTransferred = (event: GuildOwnershipTransferredEvent) => {
      setGuilds((prev) =>
        prev.map((guild) =>
          guild.guildId === event.guildId
            ? {
                ...guild,
                ownerUserId: event.newOwnerUserId,
                role: event.newOwnerUserId === user?.userId ? 'Admin' : guild.role,
              }
            : guild
        )
      );
      refreshMembersIfCached(event.guildId);
    };

    const handleMemberChanged = (event: MemberEvent) => {
      if (event.userId === user?.userId) {
        fetchGuilds();
      }
      refreshMembersIfCached(event.guildId);
    };

    const handleMemberRoleUpdated = (event: MemberRoleUpdatedEvent) => {
      if (event.userId === user?.userId) {
        setGuilds((prev) =>
          prev.map((guild) =>
            guild.guildId === event.guildId ? { ...guild, role: event.newRole } : guild
          )
        );
      }
      refreshMembersIfCached(event.guildId);
    };

    const handleUserPresenceChanged = (event: UserPresenceChangedEvent) => {
      setMembersByGuild((prev) => {
        let changed = false;
        const isActive = event.status.toLowerCase() !== 'offline';
        const next = Object.fromEntries(
          Object.entries(prev).map(([guildId, entry]) => {
            const members = entry.members.map((member) => {
              if (member.userId !== event.userId) return member;
              changed = true;
              return { ...member, isActive };
            });
            return [guildId, { ...entry, members }];
          })
        );
        return changed ? next : prev;
      });
    };

    connection.on(REALTIME_SERVER_EVENTS.guildDeleted, handleGuildDeleted);
    connection.on(REALTIME_SERVER_EVENTS.youWereBanned, handleYouWereRemoved);
    connection.on(REALTIME_SERVER_EVENTS.youWereKicked, handleYouWereRemoved);
    connection.on(REALTIME_SERVER_EVENTS.guildUpdated, handleGuildUpdated);
    connection.on(
      REALTIME_SERVER_EVENTS.guildOwnershipTransferred,
      handleGuildOwnershipTransferred
    );
    connection.on(REALTIME_SERVER_EVENTS.memberJoined, handleMemberChanged);
    connection.on(REALTIME_SERVER_EVENTS.memberLeft, handleMemberChanged);
    connection.on(REALTIME_SERVER_EVENTS.memberBanned, handleMemberChanged);
    connection.on(REALTIME_SERVER_EVENTS.memberRemoved, handleMemberChanged);
    connection.on(REALTIME_SERVER_EVENTS.memberRoleUpdated, handleMemberRoleUpdated);
    connection.on(REALTIME_SERVER_EVENTS.userPresenceChanged, handleUserPresenceChanged);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.guildDeleted, handleGuildDeleted);
      connection.off(REALTIME_SERVER_EVENTS.youWereBanned, handleYouWereRemoved);
      connection.off(REALTIME_SERVER_EVENTS.youWereKicked, handleYouWereRemoved);
      connection.off(REALTIME_SERVER_EVENTS.guildUpdated, handleGuildUpdated);
      connection.off(
        REALTIME_SERVER_EVENTS.guildOwnershipTransferred,
        handleGuildOwnershipTransferred
      );
      connection.off(REALTIME_SERVER_EVENTS.memberJoined, handleMemberChanged);
      connection.off(REALTIME_SERVER_EVENTS.memberLeft, handleMemberChanged);
      connection.off(REALTIME_SERVER_EVENTS.memberBanned, handleMemberChanged);
      connection.off(REALTIME_SERVER_EVENTS.memberRemoved, handleMemberChanged);
      connection.off(REALTIME_SERVER_EVENTS.memberRoleUpdated, handleMemberRoleUpdated);
      connection.off(REALTIME_SERVER_EVENTS.userPresenceChanged, handleUserPresenceChanged);
    };
  }, [activeGuildId, connection, fetchGuildMembers, fetchGuilds, navigate, user?.userId]);

  return (
    <GuildContext.Provider
      value={{ guilds, guildsLoading, fetchGuilds, membersByGuild, fetchGuildMembers }}
    >
      {children}
    </GuildContext.Provider>
  );
};

export const useGuilds = () => useContext(GuildContext);

export const useCurrentGuild = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { guilds, guildsLoading } = useContext(GuildContext);
  const guild = guilds.find((g) => g.guildId === guildId) ?? null;
  return { guild, guildsLoading };
};

export const useGuildMembers = (guildId: string | undefined) => {
  const { membersByGuild, fetchGuildMembers } = useContext(GuildContext);

  useEffect(() => {
    if (guildId) fetchGuildMembers(guildId);
  }, [guildId, fetchGuildMembers]);

  return guildId ? (membersByGuild[guildId]?.members ?? null) : null;
};
