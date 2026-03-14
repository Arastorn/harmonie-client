import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IconButton } from '@harmonie/ui';
import { listGuildMembers } from '@/api/guilds';
import type { GuildMember } from '@/types/guild';
import { MemberItem } from '@/shared/components/MemberItem';
import { MemberPopover } from '@/shared/components/MemberPopover';

interface SelectedMember {
  member: GuildMember;
  rect: DOMRect;
}

interface MembersPanelProps {
  onClose: () => void;
}

export const MembersPanel = ({ onClose }: MembersPanelProps) => {
  const { t } = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedMember | null>(null);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);
    listGuildMembers(guildId)
      .then((data) => setMembers(data.members))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [guildId]);

  useEffect(() => {
    setSelected(null);
  }, [guildId]);

  const handleSelect = (member: GuildMember, rect: DOMRect) => {
    setSelected((prev) => (prev?.member.userId === member.userId ? null : { member, rect }));
  };

  const onlineMembers = members.filter((m) => m.isActive);
  const offlineMembers = members.filter((m) => !m.isActive);

  return (
    <>
      <div className="w-52 flex flex-col flex-shrink-0 bg-surface-1 border border-border-2 rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-2">
          <span className="text-sm font-semibold text-text-1">{t('guild.members.title')}</span>
          <IconButton size="small" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <p className="px-3 text-sm text-text-3">{t('guild.members.loading')}</p>
          ) : (
            <>
              {onlineMembers.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold text-text-3 uppercase tracking-wide">
                    {t('guild.members.online', { count: onlineMembers.length })}
                  </p>
                  {onlineMembers.map((m) => (
                    <MemberItem key={m.userId} member={m} onSelect={handleSelect} />
                  ))}
                </div>
              )}
              {offlineMembers.length > 0 && (
                <div className={onlineMembers.length > 0 ? 'mt-4' : ''}>
                  <p className="px-3 py-1 text-xs font-semibold text-text-3 uppercase tracking-wide">
                    {t('guild.members.offline', { count: offlineMembers.length })}
                  </p>
                  {offlineMembers.map((m) => (
                    <MemberItem key={m.userId} member={m} onSelect={handleSelect} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <MemberPopover
          member={selected.member}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};
