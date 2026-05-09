import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useChannels } from '@/features/channel/ChannelContext';
import { useGuilds } from '@/features/guild/GuildContext';

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

const useIsMobileViewport = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(MOBILE_MEDIA_QUERY).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleChange = () => setIsMobile(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
};

export const ChannelIndexPage = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { channels } = useChannels();
  const { guilds, guildsLoading } = useGuilds();
  const isMobile = useIsMobileViewport();

  if (!guildId || guildsLoading || channels === null) return null;

  const guildExists = guilds.some((guild) => guild.guildId === guildId);

  if (!guildExists) {
    return <Navigate to="/" replace />;
  }

  if (isMobile) return null;

  const textChannels = channels
    .filter((c) => c.type === 'Text')
    .sort((a, b) => a.position - b.position);

  const target = textChannels.find((c) => c.isDefault) ?? textChannels[0];

  if (!target) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/guilds/${guildId}/channels/${target.channelId}`} replace />;
};
