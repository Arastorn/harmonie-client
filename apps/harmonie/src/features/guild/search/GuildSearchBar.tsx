import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hash, Search, User } from 'lucide-react';
import { Badge, Combobox, FilterInput, IconButton } from '@harmonie/ui';
import { useChannels } from '@/features/channel/ChannelContext';
import { useGuildMembers } from '@/features/guild/GuildContext';
import type { Channel, GuildMember } from '@/types/guild';

interface GuildSearchBarProps {
  query: string;
  authorId: string | null;
  channelId: string | null;
  onQueryChange: (q: string) => void;
  onAuthorChange: (id: string | null) => void;
  onChannelChange: (id: string | null) => void;
}

type DropdownState = 'filters' | 'members' | 'channels' | null;

export const GuildSearchBar = ({
  query,
  authorId,
  channelId,
  onQueryChange,
  onAuthorChange,
  onChannelChange,
}: GuildSearchBarProps) => {
  const { t } = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();

  const members = useGuildMembers(guildId) ?? [];
  const { channels } = useChannels();
  const textChannels = (channels ?? []).filter((c) => c.type === 'Text');

  const [dropdown, setDropdown] = useState<DropdownState>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdown(null);
        setPickerQuery('');
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    requestAnimationFrame(() => inputRef.current?.focus());
  }, [mobileOpen]);

  const selectedAuthor = authorId ? members.find((m) => m.userId === authorId) : null;
  const selectedChannel = channelId ? textChannels.find((c) => c.channelId === channelId) : null;

  const handleFocus = () => {
    if (dropdown === null) setDropdown('filters');
  };

  const handleFilterSelect = (filter: 'members' | 'channels') => {
    setPickerQuery('');
    setDropdown(filter);
  };

  const handleMemberSelect = (member: GuildMember) => {
    onAuthorChange(member.userId);
    setDropdown(null);
    setPickerQuery('');
    inputRef.current?.focus();
  };

  const handleChannelSelect = (channel: Channel) => {
    onChannelChange(channel.channelId);
    setDropdown(null);
    setPickerQuery('');
    inputRef.current?.focus();
  };

  const filteredMembers = pickerQuery.trim()
    ? members.filter(
        (m) =>
          (m.displayName ?? m.username).toLowerCase().includes(pickerQuery.toLowerCase()) ||
          m.username.toLowerCase().includes(pickerQuery.toLowerCase())
      )
    : members;

  const filteredChannels = pickerQuery.trim()
    ? textChannels.filter((c) => c.name.toLowerCase().includes(pickerQuery.toLowerCase()))
    : textChannels;

  const filterItems = [
    {
      value: 'members',
      icon: <User size={16} />,
      label: t('guild.search.filterByAuthor'),
      description: t('guild.search.filterByAuthorHint'),
    },
    {
      value: 'channels',
      icon: <Hash size={16} />,
      label: t('guild.search.filterByChannel'),
      description: t('guild.search.filterByChannelHint'),
    },
  ] as const;

  const memberItems = filteredMembers.map((member) => ({
    value: member.userId,
    icon: <User size={14} />,
    label: member.displayName ?? member.username,
  }));

  const channelItems = filteredChannels.map((channel) => ({
    value: channel.channelId,
    icon: <Hash size={14} />,
    label: channel.name,
  }));

  const hasActiveSearch = query.trim() !== '' || Boolean(selectedAuthor || selectedChannel);

  const renderSearchControl = (placement: 'bottom' | 'top' = 'bottom') => (
    <>
      <FilterInput onClick={() => inputRef.current?.focus()} rightElement={<Search size={13} />}>
        {selectedAuthor && (
          <Badge variant="filter" icon={<User size={10} />} onRemove={() => onAuthorChange(null)}>
            {selectedAuthor.displayName ?? selectedAuthor.username}
          </Badge>
        )}
        {selectedChannel && (
          <Badge variant="filter" icon={<Hash size={10} />} onRemove={() => onChannelChange(null)}>
            {selectedChannel.name}
          </Badge>
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            if (dropdown === null) setDropdown('filters');
          }}
          onFocus={handleFocus}
          placeholder={selectedAuthor || selectedChannel ? '' : t('guild.search.placeholder')}
          className="flex-1 min-w-0 bg-transparent outline-none font-body text-sm text-text-1 placeholder:text-text-3"
        />
      </FilterInput>

      {dropdown === 'filters' && (
        <Combobox
          items={filterItems.map((item) => ({ ...item }))}
          header={t('guild.search.filters')}
          onSelect={(value) => handleFilterSelect(value as 'members' | 'channels')}
          className="w-full sm:min-w-64"
          align="right"
          placement={placement}
        />
      )}

      {dropdown === 'members' && (
        <Combobox
          items={memberItems}
          onSelect={(value) => {
            const member = members.find((item) => item.userId === value);
            if (member) handleMemberSelect(member);
          }}
          searchValue={pickerQuery}
          onSearchChange={setPickerQuery}
          searchPlaceholder={t('guild.search.memberPickerPlaceholder')}
          emptyMessage={t('guild.search.noResults')}
          className="w-full max-h-56 flex flex-col sm:min-w-64"
          align="right"
          placement={placement}
          autoFocusSearch
        />
      )}

      {dropdown === 'channels' && (
        <Combobox
          items={channelItems}
          onSelect={(value) => {
            const channel = textChannels.find((item) => item.channelId === value);
            if (channel) handleChannelSelect(channel);
          }}
          searchValue={pickerQuery}
          onSearchChange={setPickerQuery}
          searchPlaceholder={t('guild.search.channelPickerPlaceholder')}
          emptyMessage={t('guild.search.noResults')}
          className="w-full max-h-56 flex flex-col sm:min-w-64"
          align="right"
          placement={placement}
          autoFocusSearch
        />
      )}
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="hidden w-52 sm:block">{renderSearchControl()}</div>

      <div className="sm:hidden">
        <IconButton
          size="small"
          selected={mobileOpen || hasActiveSearch}
          aria-label={t('guild.search.title')}
          title={t('guild.search.title')}
          tooltipSide="bottom"
          onClick={() => {
            setMobileOpen((open) => {
              const nextOpen = !open;
              setDropdown(nextOpen ? 'filters' : null);
              return nextOpen;
            });
          }}
        >
          <Search size={16} />
        </IconButton>

        {mobileOpen && (
          <div className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 rounded-sm border border-border-2 bg-surface-1 p-2 shadow-lg">
            <div className="relative">{renderSearchControl('top')}</div>
          </div>
        )}
      </div>
    </div>
  );
};
