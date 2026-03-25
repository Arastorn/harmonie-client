import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldBan, UserMinus } from 'lucide-react';
import { Badge, Button, IconButton, Input, Select } from '@harmonie/ui';
import { banMember, removeMember } from '@/api/guilds';
import { GuildMemberCard } from '@/features/guild/members/shared/GuildMemberCard';
import { GuildMemberIdentity } from '@/features/guild/members/shared/GuildMemberIdentity';
import type { GuildMember, GuildMemberRole } from '@/types/guild';

type ConfirmMode = 'kick' | 'ban' | null;

export interface MemberRowProps {
  member: GuildMember;
  guildId: string;
  isOwner: boolean;
  canRemove: boolean;
  canBan: boolean;
  canEditRole: boolean;
  isChangingRole: boolean;
  onRemoved: (userId: string) => void;
  onBanned: (userId: string) => void;
  onRoleChange: (userId: string, role: GuildMemberRole) => void;
}

export const MemberRow = ({
  member,
  guildId,
  isOwner,
  canRemove,
  canBan,
  canEditRole,
  isChangingRole,
  onRemoved,
  onBanned,
  onRoleChange,
}: MemberRowProps) => {
  const { t } = useTranslation();
  const label = member.displayName ?? member.username;

  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [banReason, setBanReason] = useState('');
  const [isActing, setIsActing] = useState(false);

  const cancelConfirm = () => {
    setConfirmMode(null);
    setBanReason('');
  };

  const handleKickConfirm = async () => {
    setIsActing(true);
    try {
      await removeMember(guildId, member.userId);
      onRemoved(member.userId);
    } catch {
      setIsActing(false);
      setConfirmMode(null);
    } finally {
      setIsActing(false);
    }
  };

  const handleBanConfirm = async () => {
    setIsActing(true);
    try {
      await banMember(guildId, {
        userId: member.userId,
        reason: banReason.trim() || null,
        purgeMessagesDays: 0,
      });
      onBanned(member.userId);
    } catch {
      setIsActing(false);
      setConfirmMode(null);
      setBanReason('');
    } finally {
      setIsActing(false);
    }
  };

  const roleOptions = [
    { value: 'Admin', label: t('guild.members.admin.roleAdmin') },
    { value: 'Member', label: t('guild.members.admin.roleMember') },
  ];

  const banExtra =
    confirmMode === 'ban' ? (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder={t('guild.bans.reasonPlaceholder')}
            disabled={isActing}
            autoFocus
          />
        </div>
        <Button
          variant="tertiary"
          onClick={cancelConfirm}
          disabled={isActing}
          className="px-3 py-1.5 text-xs shrink-0"
        >
          {t('guild.members.admin.cancel')}
        </Button>
        <Button
          variant="danger"
          isLoading={isActing}
          onClick={handleBanConfirm}
          className="px-3 py-1.5 text-xs shrink-0"
        >
          {t('guild.bans.banAction')}
        </Button>
      </div>
    ) : undefined;

  return (
    <GuildMemberCard user={member} extra={banExtra}>
      {confirmMode === null ? (
        <>
          <GuildMemberIdentity
            label={label}
            subtitle={member.displayName ? `@${member.username}` : undefined}
          />
          <div className="flex items-center gap-2 shrink-0">
            {isOwner ? (
              <Badge variant="owner">{t('guild.members.popover.ownerLabel')}</Badge>
            ) : canEditRole ? (
              <Select
                size="sm"
                className="w-28"
                options={roleOptions}
                value={member.role}
                disabled={isChangingRole}
                aria-label={t('guild.members.admin.roleLabel')}
                onChange={(value) => onRoleChange(member.userId, value as GuildMemberRole)}
              />
            ) : (
              <Badge variant="default">{member.role}</Badge>
            )}
            {canRemove && (
              <IconButton
                size="small"
                variant="ghost"
                onClick={() => setConfirmMode('kick')}
                aria-label={t('guild.members.kickAction')}
                title={t('guild.members.kickAction')}
              >
                <UserMinus size={13} />
              </IconButton>
            )}
            {canBan && (
              <IconButton
                size="small"
                variant="ghost"
                onClick={() => setConfirmMode('ban')}
                aria-label={t('guild.bans.banAction')}
                title={t('guild.bans.banAction')}
              >
                <ShieldBan size={13} />
              </IconButton>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="flex-1 text-sm font-medium text-text-2 truncate">
            {confirmMode === 'kick'
              ? t('guild.members.admin.confirmKick', { name: label })
              : t('guild.members.admin.confirmBan', { name: label })}
          </p>
          {confirmMode === 'kick' && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="tertiary"
                onClick={cancelConfirm}
                disabled={isActing}
                className="px-3 py-1.5 text-xs"
              >
                {t('guild.members.admin.cancel')}
              </Button>
              <Button
                variant="danger"
                isLoading={isActing}
                onClick={handleKickConfirm}
                className="px-3 py-1.5 text-xs"
              >
                {t('guild.members.kickAction')}
              </Button>
            </div>
          )}
        </>
      )}
    </GuildMemberCard>
  );
};
