import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthGuard } from '@/routes/AuthGuard';
import { GuestGuard } from '@/routes/GuestGuard';
import { ConnectPage } from '@/features/auth/ConnectPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { GuildIndexPage } from '@/features/guild/GuildIndexPage';
import { ChannelIndexPage } from '@/features/channel/ChannelIndexPage';
import { TextChannelView } from '@/features/channel/text/TextChannelView';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <GuestGuard />,
    children: [
      {
        index: true,
        element: <Navigate to="/auth/connect" replace />,
      },
      {
        path: 'connect',
        element: <ConnectPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <GuildIndexPage />,
          },
          {
            path: 'guilds/:guildId',
            children: [
              {
                index: true,
                element: <ChannelIndexPage />,
              },
              {
                path: 'channels/:channelId',
                element: <TextChannelView />,
              },
              {
                path: 'voice/:channelId',
                element: null,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
