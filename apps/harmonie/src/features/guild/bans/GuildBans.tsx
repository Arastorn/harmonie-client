import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, Button } from '@harmonie/ui';
import { listGuildBans, unbanMember } from '@/api/guilds';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { GuildBan } from '@/types/guild';

interface GuildBansProps {
  guildId: string;
}

const BanItem = ({
  ban,
  onUnban,
  isUnbanning,
}: {
  ban: GuildBan;
  onUnban: (userId: string) => void;
  isUnbanning: boolean;
}) => {
  const avatarUrl = useFileBlobUrl(ban.avatarFileId);
  const label = ban.displayName ?? ban.username;

  return (
    <li className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2">
      <Avatar
        alt={label}
        avatarUrl={avatarUrl}
        icon={ban.avatar?.icon ?? 'PawPrint'}
        color={ban.avatar?.color ?? 'var(--color-cat-1-fg)'}
        bg={ban.avatar?.bg ?? 'var(--color-cat-1)'}
        size={32}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-1 truncate">{label}</p>
        {ban.reason && <p className="text-xs text-text-3 truncate">{ban.reason}</p>}
      </div>
      <Button
        variant="tertiary"
        isLoading={isUnbanning}
        onClick={() => onUnban(ban.userId)}
        className="px-3 py-1.5 text-xs shrink-0"
      >
        <Trash2 size={13} />
      </Button>
    </li>
  );
};

export const GuildBans = ({ guildId }: GuildBansProps) => {
  const { t } = useTranslation();
  const [bans, setBans] = useState<GuildBan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unbanningId, setUnbanningId] = useState<string | null>(null);

  const fetchBans = useCallback(() => {
    setIsLoading(true);
    listGuildBans(guildId)
      .then((data) => setBans(data.bans))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [guildId]);

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  const handleUnban = async (userId: string) => {
    setUnbanningId(userId);
    try {
      await unbanMember(guildId, userId);
      setBans((prev) => prev.filter((b) => b.userId !== userId));
    } finally {
      setUnbanningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t('guild.bans.description')}</p>

      {isLoading ? (
        <p className="text-sm text-text-3">{t('guild.bans.loading')}</p>
      ) : bans.length === 0 ? (
        <p className="text-sm text-text-3">{t('guild.bans.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bans.map((ban) => (
            <BanItem
              key={ban.userId}
              ban={ban}
              onUnban={handleUnban}
              isUnbanning={unbanningId === ban.userId}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
