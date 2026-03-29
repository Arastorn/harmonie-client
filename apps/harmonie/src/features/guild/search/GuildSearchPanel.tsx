import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IconButton } from '@harmonie/ui';
import { searchGuildMessages } from '@/api/guilds';
import type { GuildMessageSearchItem } from '@/types/guild';
import { GuildSearchResultItem } from './GuildSearchResultItem';

interface GuildSearchPanelProps {
  query: string;
  authorId: string | null;
  channelId: string | null;
  onClose: () => void;
}

export const GuildSearchPanel = ({
  query,
  authorId,
  channelId,
  onClose,
}: GuildSearchPanelProps) => {
  const { t, i18n } = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();

  const [results, setResults] = useState<GuildMessageSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setError(false);
      return;
    }

    if (!guildId) return;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await searchGuildMessages(guildId, {
          q: trimmed,
          authorId: authorId ?? undefined,
          channelId: channelId ?? undefined,
          limit: 30,
        });
        setResults(response.items);
        setSearched(true);
      } catch {
        setError(true);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, authorId, channelId, guildId]);

  const handleResultClick = (item: GuildMessageSearchItem) => {
    if (!guildId) return;
    navigate(`/guilds/${guildId}/channels/${item.channelId}`, {
      state: {
        searchTarget: {
          messageId: item.messageId,
          nonce: `${item.messageId}-${Date.now()}`,
        },
      },
    });
    onClose();
  };

  return (
    <div className="w-72 flex flex-col shrink-0 bg-surface-1 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-surface-2 rounded-t-md">
        <span className="text-sm font-semibold text-text-1">{t('guild.search.title')}</span>
        <IconButton size="small" onClick={onClose}>
          <X size={14} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1">
        {!query.trim() && <p className="px-3 py-2 text-sm text-text-3">{t('guild.search.hint')}</p>}

        {loading && <p className="px-3 py-2 text-sm text-text-3">{t('guild.search.loading')}</p>}

        {error && <p className="px-3 py-2 text-sm text-error-fg">{t('guild.search.error')}</p>}

        {!loading && !error && searched && results.length === 0 && (
          <p className="px-3 py-2 text-sm text-text-3">{t('guild.search.empty')}</p>
        )}

        {!loading &&
          !error &&
          results.map((item) => (
            <GuildSearchResultItem
              key={item.messageId}
              item={item}
              language={i18n.language}
              onClick={() => handleResultClick(item)}
            />
          ))}
      </div>
    </div>
  );
};
