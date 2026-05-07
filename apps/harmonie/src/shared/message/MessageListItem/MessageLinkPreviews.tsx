import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LinkPreview } from '@/types/channel';

interface MessageLinkPreviewsProps {
  previews?: LinkPreview[] | null;
}

const getPreviewHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const MessageLinkPreviews = ({ previews }: MessageLinkPreviewsProps) => {
  const { t } = useTranslation();
  const visiblePreviews = previews?.filter((preview) => preview.url) ?? [];

  if (visiblePreviews.length === 0) return null;

  return (
    <div className="mt-2 flex max-w-xl flex-col gap-2">
      {visiblePreviews.map((preview) => {
        const host = getPreviewHost(preview.url);
        const label = preview.siteName || host;

        return (
          <a
            key={preview.url}
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('channel.messages.openLinkPreview', { title: preview.title || label })}
            className={[
              'group grid min-w-0 overflow-hidden rounded-md border border-border-2 bg-surface-1',
              'transition-colors hover:border-primary/60 hover:bg-surface-2',
              preview.imageUrl ? 'sm:grid-cols-[minmax(0,1fr)_128px]' : '',
            ].join(' ')}
          >
            <div className="min-w-0 border-l-2 border-primary/70 px-3 py-2.5">
              <div className="mb-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-text-3">
                <span className="truncate">{label}</span>
                <ExternalLink size={12} className="shrink-0 opacity-70" aria-hidden="true" />
              </div>
              {preview.title && (
                <div className="line-clamp-2 text-sm font-semibold text-text-1 group-hover:text-primary">
                  {preview.title}
                </div>
              )}
              {preview.description && (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-2">
                  {preview.description}
                </p>
              )}
              <div className="mt-1 truncate text-xs text-text-3">{host}</div>
            </div>
            {preview.imageUrl && (
              <div className="hidden min-h-24 overflow-hidden border-l border-border-2 bg-surface-3 sm:block">
                <img
                  src={preview.imageUrl}
                  alt={t('channel.messages.linkPreviewImageAlt', {
                    title: preview.title || label,
                  })}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </a>
        );
      })}
    </div>
  );
};
