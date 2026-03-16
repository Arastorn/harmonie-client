import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { ChannelItem } from '@harmonie/ui';
import type { Channel } from '@/types/guild';
import { useChannels } from './ChannelContext';

interface SortableChannelItemProps {
  channel: Channel;
  active: boolean;
  unread: boolean;
  canReorder: boolean;
  onNavigate: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMenuClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  menuLabel?: string;
}

const SortableChannelItem = ({
  channel,
  active,
  unread,
  canReorder,
  onNavigate,
  onContextMenu,
  onMenuClick,
  menuLabel,
}: SortableChannelItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: channel.channelId,
    disabled: !canReorder,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={canReorder ? 'cursor-grab active:cursor-grabbing' : undefined}
      {...(canReorder ? { ...listeners, ...attributes } : {})}
    >
      <ChannelItem
        type={channel.type === 'Text' ? 'text' : 'voice'}
        label={channel.name}
        active={active}
        unread={unread}
        onClick={onNavigate}
        onContextMenu={onContextMenu}
        onMenuClick={onMenuClick}
        menuLabel={menuLabel}
      />
    </div>
  );
};

interface ChannelSectionProps {
  sectionChannels: Channel[];
  type: 'Text' | 'Voice';
  canReorder: boolean;
  hasUnread?: (channelId: string) => boolean;
  onContextMenu?: (e: React.MouseEvent, channel: Channel) => void;
  onMenuClick?: (e: React.MouseEvent<HTMLButtonElement>, channel: Channel) => void;
  menuLabel?: string;
}

export const ChannelSection = ({
  sectionChannels,
  type,
  canReorder,
  hasUnread,
  onContextMenu,
  onMenuClick,
  menuLabel,
}: ChannelSectionProps) => {
  const { guildId, channelId: activeChannelId } = useParams<{
    guildId: string;
    channelId: string;
  }>();
  const navigate = useNavigate();
  const { channels, applyReorder } = useChannels();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const ids = sectionChannels.map((c) => c.channelId);
  const isTextSection = type === 'Text';

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !guildId) return;

    const oldIndex = sectionChannels.findIndex((c) => c.channelId === active.id);
    const newIndex = sectionChannels.findIndex((c) => c.channelId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Build reordered list for this section with sequential positions
    const reorderedSection = [...sectionChannels];
    const [moved] = reorderedSection.splice(oldIndex, 1);
    reorderedSection.splice(newIndex, 0, moved);
    const reorderedWithPositions = reorderedSection.map((c, i) => ({ ...c, position: i + 1 }));

    // Merge with channels from the other section (unchanged)
    const allChannels = channels ?? [];
    const otherChannels = allChannels.filter((c) => c.type !== sectionChannels[0].type);
    const merged = [...otherChannels, ...reorderedWithPositions];

    void applyReorder(guildId, merged);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-0.5">
          {sectionChannels.map((channel) => (
            <SortableChannelItem
              key={channel.channelId}
              channel={channel}
              active={channel.channelId === activeChannelId}
              unread={channel.type === 'Text' ? !!hasUnread?.(channel.channelId) : false}
              canReorder={canReorder}
              onNavigate={() =>
                navigate(
                  isTextSection
                    ? `/guilds/${guildId}/channels/${channel.channelId}`
                    : `/guilds/${guildId}/voice/${channel.channelId}`
                )
              }
              onContextMenu={onContextMenu ? (e) => onContextMenu(e, channel) : undefined}
              onMenuClick={onMenuClick ? (e) => onMenuClick(e, channel) : undefined}
              menuLabel={menuLabel}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
