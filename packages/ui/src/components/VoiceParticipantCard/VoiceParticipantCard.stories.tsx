import type { Meta, StoryObj } from '@storybook/react';
import { VoiceParticipantCard } from './VoiceParticipantCard';

const meta: Meta<typeof VoiceParticipantCard> = {
  title: 'Display/VoiceParticipantCard',
  component: VoiceParticipantCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof VoiceParticipantCard>;

const cardStyle = { width: '20rem', height: '15rem' };

export const WithInitials: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    titleClassName: 'text-2xl',
    style: {
      ...cardStyle,
      background: 'linear-gradient(145deg, hsl(120 42% 94%) 0%, hsl(148 38% 90%) 100%)',
    },
  },
};

export const WithImage: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    titleClassName: 'text-2xl',
    style: cardStyle,
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    avatarIcon: 'PawPrint',
    avatarColor: '#6B5F58',
    avatarBg: '#D4E4D7',
    titleClassName: 'text-2xl',
    style: cardStyle,
  },
};

export const Summary: Story = {
  args: {
    title: '3 participants',
    avatarLabel: '+3',
    avatarSize: 96,
    titleClassName: 'text-2xl',
    style: cardStyle,
  },
};

export const Speaking: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    titleClassName: 'text-2xl',
    isSpeaking: true,
    style: {
      ...cardStyle,
      background: 'linear-gradient(145deg, hsl(120 42% 94%) 0%, hsl(148 38% 90%) 100%)',
    },
  },
};

export const SpeakingWithIcon: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    avatarIcon: 'PawPrint',
    avatarColor: '#6B5F58',
    avatarBg: '#D4E4D7',
    titleClassName: 'text-2xl',
    isSpeaking: true,
    style: cardStyle,
  },
};
