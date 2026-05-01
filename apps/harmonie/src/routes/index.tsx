import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { ConversationsLayout } from '@/layouts/ConversationsLayout';
import { GuildLayout } from '@/layouts/GuildLayout';
import { AuthGuard } from '@/routes/AuthGuard';
import { GuestGuard } from '@/routes/GuestGuard';
import { ConnectPage } from '@/features/auth/ConnectPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ChannelIndexPage } from '@/features/channel/ChannelIndexPage';
import { TextChannelView } from '@/features/channel/text/TextChannelView';
import { VoiceChannelView } from '@/features/channel/voice/VoiceChannelView';
import { ConversationIndexPage } from '@/features/conversation/ConversationIndexPage';
import { ConversationView } from '@/features/conversation/view/ConversationView';

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
            element: <Navigate to="/conversations" replace />,
          },
          {
            element: <ConversationsLayout />,
            children: [
              {
                path: 'conversations',
                children: [
                  {
                    index: true,
                    element: <ConversationIndexPage />,
                  },
                  {
                    path: ':conversationId',
                    element: <ConversationView />,
                  },
                ],
              },
            ],
          },
          {
            element: <GuildLayout />,
            children: [
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
                    element: <VoiceChannelView />,
                  },
                ],
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
