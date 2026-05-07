import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { matchPath, useLocation } from 'react-router-dom';

interface GuildWorkspaceContextValue {
  membersOpen: boolean;
  searchQuery: string;
  searchAuthorId: string | null;
  searchChannelId: string | null;
  hasSearch: boolean;
  toggleMembersPanel: () => void;
  closeMembersPanel: () => void;
  setSearchQuery: (q: string) => void;
  setSearchAuthorId: (id: string | null) => void;
  setSearchChannelId: (id: string | null) => void;
  clearSearch: () => void;
}

const GuildWorkspaceContext = createContext<GuildWorkspaceContextValue | null>(null);

interface GuildWorkspaceProviderProps {
  children: ReactNode;
}

export const GuildWorkspaceProvider = ({ children }: GuildWorkspaceProviderProps) => {
  const location = useLocation();
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchAuthorId, setSearchAuthorIdState] = useState<string | null>(null);
  const [searchChannelId, setSearchChannelIdState] = useState<string | null>(null);

  const hasSearch =
    searchQuery.trim() !== '' || searchAuthorId !== null || searchChannelId !== null;

  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    setSearchAuthorIdState(null);
    setSearchChannelIdState(null);
  }, []);

  const toggleMembersPanel = useCallback(() => {
    clearSearch();
    setMembersOpen((open) => !open);
  }, [clearSearch]);

  const closeMembersPanel = useCallback(() => {
    setMembersOpen(false);
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
    if (q.trim()) setMembersOpen(false);
  }, []);

  const setSearchAuthorId = useCallback((id: string | null) => {
    setSearchAuthorIdState(id);
    setMembersOpen(false);
  }, []);

  const setSearchChannelId = useCallback((id: string | null) => {
    setSearchChannelIdState(id);
    setMembersOpen(false);
  }, []);

  const isTextChannelRoute =
    matchPath('/guilds/:guildId/channels/:channelId', location.pathname) !== null;

  useEffect(() => {
    if (!isTextChannelRoute) {
      setMembersOpen(false);
    }
  }, [isTextChannelRoute]);

  const value = useMemo<GuildWorkspaceContextValue>(
    () => ({
      membersOpen,
      searchQuery,
      searchAuthorId,
      searchChannelId,
      hasSearch,
      toggleMembersPanel,
      closeMembersPanel,
      setSearchQuery,
      setSearchAuthorId,
      setSearchChannelId,
      clearSearch,
    }),
    [
      clearSearch,
      closeMembersPanel,
      hasSearch,
      membersOpen,
      searchAuthorId,
      searchChannelId,
      searchQuery,
      setSearchAuthorId,
      setSearchChannelId,
      setSearchQuery,
      toggleMembersPanel,
    ]
  );

  return <GuildWorkspaceContext.Provider value={value}>{children}</GuildWorkspaceContext.Provider>;
};

export const useGuildWorkspace = () => {
  const context = useContext(GuildWorkspaceContext);

  if (!context) {
    throw new Error('useGuildWorkspace must be used within a GuildWorkspaceProvider');
  }

  return context;
};
