import { useCallback, useEffect, useState } from 'react';
import { Copy, Link, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@harmonie/ui';
import { createGuildInvite, listGuildInvites, revokeGuildInvite } from '@/api/guilds';
import type { GuildInvite } from '@/types/guild';

interface GuildInvitesProps {
  guildId: string;
}

export const GuildInvites = ({ guildId }: GuildInvitesProps) => {
  const { t } = useTranslation();
  const [invites, setInvites] = useState<GuildInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxUsesInput, setMaxUsesInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchInvites = useCallback(() => {
    setIsLoading(true);
    listGuildInvites(guildId)
      .then((data) => setInvites(data.invites))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [guildId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCreate = async () => {
    setIsCreating(true);
    setCreateError(false);
    const parsedMaxUses = maxUsesInput.trim() ? parseInt(maxUsesInput, 10) : null;
    try {
      const newInvite = await createGuildInvite(guildId, {
        maxUses: parsedMaxUses,
        expiresInHours: null,
      });
      // Refresh the list to get the full invite object
      setInvites((prev) => [
        {
          code: newInvite.code,
          creatorId: newInvite.creatorId,
          usesCount: newInvite.usesCount,
          maxUses: newInvite.maxUses,
          expiresAtUtc: newInvite.expiresAtUtc,
          createdAtUtc: newInvite.createdAtUtc,
          revokedAtUtc: null,
          isExpired: false,
        },
        ...prev,
      ]);
    } catch {
      setCreateError(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (code: string) => {
    setRevokingCode(code);
    try {
      await revokeGuildInvite(guildId, code);
      setInvites((prev) => prev.filter((inv) => inv.code !== code));
    } catch {
      // Silently fail — keep the invite in the list
    } finally {
      setRevokingCode(null);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const activeInvites = invites.filter((inv) => !inv.revokedAtUtc && !inv.isExpired);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t('guild.invites.description')}</p>

      <div className="flex items-end gap-3">
        <div className="w-40">
          <Input
            label={t('guild.invites.maxUsesLabel')}
            placeholder={t('guild.invites.maxUsesPlaceholder')}
            type="number"
            min={1}
            value={maxUsesInput}
            onChange={(e) => setMaxUsesInput(e.target.value)}
          />
        </div>
        <Button variant="primary" isLoading={isCreating} onClick={handleCreate}>
          <Link size={14} />
          {t('guild.invites.create')}
        </Button>
      </div>

      {createError && <p className="text-sm text-error-fg">{t('guild.invites.createError')}</p>}

      {isLoading ? (
        <p className="text-sm text-text-3">{t('guild.invites.loading')}</p>
      ) : activeInvites.length === 0 ? (
        <p className="text-sm text-text-3">{t('guild.invites.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {activeInvites.map((invite) => (
            <li
              key={invite.code}
              className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-2"
            >
              <span className="font-mono text-sm text-text-1 truncate">{invite.code}</span>
              <span className="text-xs text-text-3 shrink-0">
                {invite.maxUses !== null
                  ? t('guild.invites.usesOf', { count: invite.usesCount, max: invite.maxUses })
                  : t('guild.invites.uses', { count: invite.usesCount })}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="tertiary"
                  onClick={() => handleCopy(invite.code)}
                  title={t('guild.invites.copy')}
                  className="px-3 py-1.5 text-xs"
                >
                  <Copy size={13} />
                  {copiedCode === invite.code ? t('guild.invites.copied') : t('guild.invites.copy')}
                </Button>
                <Button
                  variant="tertiary"
                  isLoading={revokingCode === invite.code}
                  onClick={() => handleRevoke(invite.code)}
                  title={t('guild.invites.revoke')}
                  className="px-3 py-1.5 text-xs"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
