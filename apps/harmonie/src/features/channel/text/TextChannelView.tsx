import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Separator } from '@harmonie/ui';
import { getChannelMessages } from '@/api/channels';
import type { Message } from '@/types/channel';
import type { GuildMember } from '@/types/guild';
import { useGuildMembers } from '@/features/guild/GuildContext';
import { MemberPopover } from '@/shared/components/MemberPopover';
import { MessageItem } from './MessageItem';

interface SelectedMember {
  member: GuildMember;
  rect: DOMRect;
}

export const TextChannelView = () => {
  const { t } = useTranslation();
  const { channelId, guildId } = useParams<{ channelId: string; guildId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<SelectedMember | null>(null);

  const members = useGuildMembers(guildId);
  const membersMap = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m])), [members]);

  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    setError(false);
    getChannelMessages(channelId)
      .then((data) => setMessages(data.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-text-3 text-sm bg-surface-1 border border-border-2 rounded-sm">
        {t('channel.messages.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-error-fg text-sm bg-surface-1 border border-border-2 rounded-sm">
        {t('channel.messages.error')}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-text-3 text-sm bg-surface-1 border border-border-2 rounded-sm">
        {t('channel.messages.empty')}
      </div>
    );
  }

  const handleAvatarClick = (member: GuildMember, rect: DOMRect) => {
    setSelected((prev) => (prev?.member.userId === member.userId ? null : { member, rect }));
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto px-4 py-4 gap-0 bg-surface-1 border border-border-2 rounded-sm">
        {messages.map((message, index) => (
          <div key={message.messageId}>
            <MessageItem
              message={message}
              member={membersMap.get(message.authorUserId)}
              onAvatarClick={handleAvatarClick}
            />
            {index < messages.length - 1 && <Separator />}
          </div>
        ))}
      </div>
      {selected && (
        <MemberPopover
          member={selected.member}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
          side="right"
        />
      )}
    </>
  );
};
