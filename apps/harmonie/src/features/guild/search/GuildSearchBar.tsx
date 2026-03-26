import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hash, Search, User } from 'lucide-react';
import { Badge, Combobox, FilterInput } from '@harmonie/ui';
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

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdown(null);
        setPickerQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  return (
    <div ref={containerRef} className="relative w-52">
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
          className="min-w-64"
          align="right"
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
          className="min-w-64 max-h-56 flex flex-col"
          align="right"
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
          className="min-w-64 max-h-56 flex flex-col"
          align="right"
          autoFocusSearch
        />
      )}
    </div>
  );
};
