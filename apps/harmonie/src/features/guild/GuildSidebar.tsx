import { useState } from 'react';
import { DoorOpen, Mailbox, Pencil, Plus, ShieldBan, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ContextMenu, GuildAvatar } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useGuilds } from './GuildContext';
import { GuildCreateOrJoinModal } from '@/features/guild/GuildCreateOrJoinModal';
import { useGuildPermissions } from '@/features/guild/hooks/useGuildPermissions';
import type { Guild } from '@/types/guild';
import { GuildSettingsModal } from '@/features/guild/GuildSettingsModal';
import { AdminSectionMenu } from '@/features/guild/types/adminSection';

const GuildSidebarItem = ({
  guild,
  isActive,
  onClick,
  onOpenContextMenu,
}: {
  guild: Guild;
  isActive: boolean;
  onClick: () => void;
  onOpenContextMenu: (e: React.MouseEvent, guild: Guild) => void;
}) => {
  const iconUrl = useFileBlobUrl(guild.iconFileId);
  const { canOpenGuildContextMenu } = useGuildPermissions(guild);

  return (
    <button
      onClick={onClick}
      onContextMenu={canOpenGuildContextMenu ? (e) => onOpenContextMenu(e, guild) : undefined}
      title={guild.name}
      className={[
        'w-10 h-10 rounded-sm flex items-center justify-center shrink-0 bg-transparent cursor-pointer first:mt-1 last:mb-1 transform-gpu transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.14] hover:-translate-y-0.5 active:scale-[1.02] active:translate-y-0',
        isActive ? 'ring ring-primary' : 'hover:bg-surface-2',
      ].join(' ')}
    >
      <GuildAvatar
        iconUrl={iconUrl}
        alt={guild.name}
        icon={guild.icon?.name ?? undefined}
        color={guild.icon?.color ?? undefined}
        bg={guild.icon?.bg ?? undefined}
        size={32}
      />
    </button>
  );
};

export const GuildSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { guildId: activeGuildId } = useParams<{ guildId: string }>();
  const { guilds, fetchGuilds } = useGuilds();
  const [addMenu, setAddMenu] = useState<{ x: number; y: number } | null>(null);
  const [createOrJoinMode, setCreateOrJoinMode] = useState<'create' | 'join' | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    guild: Guild;
    position: { x: number; y: number };
  } | null>(null);
  const [editSection, setEditSection] = useState<AdminSectionMenu>('identity');
  const [editGuild, setEditGuild] = useState<Guild | null>(null);

  const handleGuildContextMenu = (e: React.MouseEvent, guild: Guild) => {
    e.preventDefault();
    setContextMenu({ guild, position: { x: e.clientX, y: e.clientY } });
  };

  const handleContextMenuClick = (editSection: AdminSectionMenu, guild: Guild) => {
    setEditSection(editSection);
    setEditGuild(guild);
    setContextMenu(null);
  };

  const { canAccessDangerZone, canLeaveGuild, canManageGuild } = useGuildPermissions(
    contextMenu?.guild
  );

  const guildContextMenuItems = contextMenu
    ? [
        ...(canManageGuild
          ? [
              {
                label: t('guild.contextMenu.edit'),
                icon: <Pencil size={14} />,
                onClick: () => handleContextMenuClick('identity', contextMenu.guild),
              },
              {
                label: t('guild.contextMenu.invite'),
                icon: <Mailbox size={14} />,
                onClick: () => handleContextMenuClick('invites', contextMenu.guild),
              },
              {
                label: t('guild.contextMenu.ban'),
                icon: <ShieldBan size={14} />,
                onClick: () => handleContextMenuClick('bans', contextMenu.guild),
              },
            ]
          : []),
        ...(canAccessDangerZone
          ? [
              {
                label: t('guild.contextMenu.delete'),
                icon: <Trash2 size={14} />,
                onClick: () => handleContextMenuClick('danger', contextMenu.guild),
              },
            ]
          : []),
        ...(canLeaveGuild
          ? [
              {
                label: t('guild.contextMenu.leave'),
                icon: <DoorOpen size={14} />,
                onClick: () => handleContextMenuClick('leave', contextMenu.guild),
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <nav className="flex flex-col items-center gap-2 w-16 py-2 bg-surface-1 border border-border-2 shrink-0 rounded-sm">
        <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto w-full px-2 py-1">
          {/* List of guilds */}
          {guilds.map((guild) => {
            return (
              <GuildSidebarItem
                key={guild.guildId}
                guild={guild}
                isActive={guild.guildId === activeGuildId}
                onClick={() => navigate(`/guilds/${guild.guildId}`)}
                onOpenContextMenu={handleGuildContextMenu}
              />
            );
          })}
          {/* Button to add or join a guild */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setAddMenu({ x: e.clientX, y: e.clientY });
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setAddMenu({ x: e.clientX, y: e.clientY });
            }}
            title={t('guild.createJoin.title')}
            className={[
              'w-10 h-10 rounded-sm flex items-center justify-center shrink-0 cursor-pointer bg-surface-2 text-text-1 border border-dashed border-border-2 hover:bg-surface-hover transform-gpu transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] hover:-translate-y-px active:scale-[1.01] active:translate-y-0',
              addMenu ? 'ring ring-primary' : '',
            ].join(' ')}
          >
            <Plus size={18} />
          </button>
        </div>
      </nav>
      {/* Context menu for adding or joining a guild */}
      {addMenu && (
        <ContextMenu
          position={addMenu}
          onClose={() => setAddMenu(null)}
          items={[
            {
              label: t('guild.createJoin.createTitle'),
              icon: <Plus size={14} />,
              onClick: () => {
                setCreateOrJoinMode('create');
                setAddMenu(null);
              },
            },
            {
              label: t('guild.createJoin.joinTitle'),
              icon: <Mailbox size={14} />,
              onClick: () => {
                setCreateOrJoinMode('join');
                setAddMenu(null);
              },
            },
          ]}
        />
      )}
      {/* Model to join or create a guild */}
      {createOrJoinMode && (
        <GuildCreateOrJoinModal mode={createOrJoinMode} onClose={() => setCreateOrJoinMode(null)} />
      )}
      {/* Context menu for guild actions */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          items={guildContextMenuItems}
        />
      )}
      {editGuild && (
        <GuildSettingsModal
          guild={editGuild}
          initialSection={editSection}
          onClose={() => setEditGuild(null)}
          onUpdated={() => {
            setEditGuild(null);
            fetchGuilds();
          }}
          onDeleted={() => {
            setEditGuild(null);
            fetchGuilds();
            navigate('/');
          }}
          onLeave={() => {
            setEditGuild(null);
            fetchGuilds();
            navigate('/');
          }}
        />
      )}
    </>
  );
};
