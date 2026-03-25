import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listGuildBans } from '@/api/guilds';
import { BanItem } from '@/features/guild/members/admin/BanItem';
import type { GuildBan } from '@/types/guild';

interface GuildBansProps {
  guildId: string;
}

export const GuildBans = ({ guildId }: GuildBansProps) => {
  const { t } = useTranslation();
  const [bans, setBans] = useState<GuildBan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleUnbanned = (userId: string) => {
    setBans((prev) => prev.filter((b) => b.userId !== userId));
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
            <BanItem key={ban.userId} ban={ban} guildId={guildId} onUnbanned={handleUnbanned} />
          ))}
        </ul>
      )}
    </div>
  );
};
