import { useMemo, useState } from 'react';
import { BanMemberModal } from '@/features/guild/bans/BanMemberModal';
import { useGuilds } from '@/features/guild/GuildContext';
import { useGuildPermissions } from '@/features/guild/hooks/useGuildPermissions';
import type { GuildMember } from '@/types/guild';

export const useMemberBanActions = (guildId: string | undefined, onBanned?: () => void) => {
  const [banTarget, setBanTarget] = useState<GuildMember | null>(null);
  const { guilds, fetchGuildMembers } = useGuilds();

  const guild = useMemo(() => guilds.find((item) => item.guildId === guildId), [guildId, guilds]);
  const { canBanMember } = useGuildPermissions(guild);

  const banModal =
    banTarget && guildId ? (
      <BanMemberModal
        guildId={guildId}
        member={banTarget}
        onClose={() => setBanTarget(null)}
        onBanned={() => {
          fetchGuildMembers(guildId, true);
          setBanTarget(null);
          onBanned?.();
        }}
      />
    ) : null;

  return {
    banModal,
    canBanMember,
    openBanModal: setBanTarget,
  };
};
