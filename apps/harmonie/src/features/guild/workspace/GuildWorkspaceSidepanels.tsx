import { MembersPanel } from '@/features/guild/members/panel/MembersPanel';
import { GuildSearchPanel } from '@/features/guild/search/GuildSearchPanel';
import { useGuildWorkspace } from './GuildWorkspaceProvider';

interface GuildWorkspaceSidepanelsProps {
  hasGuilds: boolean;
}

export const GuildWorkspaceSidepanels = ({ hasGuilds }: GuildWorkspaceSidepanelsProps) => {
  const {
    membersOpen,
    searchQuery,
    searchAuthorId,
    searchChannelId,
    hasSearch,
    clearSearch,
    closeMembersPanel,
  } = useGuildWorkspace();

  if (!hasGuilds) return null;

  return (
    <>
      {hasSearch && (
        <GuildSearchPanel
          query={searchQuery}
          authorId={searchAuthorId}
          channelId={searchChannelId}
          onClose={clearSearch}
        />
      )}
      {membersOpen && <MembersPanel onClose={closeMembersPanel} />}
    </>
  );
};
