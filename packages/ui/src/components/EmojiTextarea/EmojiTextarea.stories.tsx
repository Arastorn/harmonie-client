import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EmojiTextarea } from './EmojiTextarea';

const meta: Meta<typeof EmojiTextarea> = {
  title: 'Components/EmojiTextarea',
  component: EmojiTextarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmojiTextarea>;

const InteractiveTemplate = (args: React.ComponentProps<typeof EmojiTextarea>) => {
  const [value, setValue] = useState(args.value ?? '');
  return <EmojiTextarea {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'Bio',
    placeholder: 'Tell something about yourself…',
    rows: 5,
    value: '',
  },
};

export const WithLabel: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'About you',
    placeholder: 'Tell something about yourself…',
    rows: 5,
    value: '',
  },
};

export const Prefilled: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'Bio',
    rows: 5,
    value: 'Hey! I love gardening 🌿 and hiking 🏔️',
  },
};

export const WithError: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'Bio',
    placeholder: 'Tell something about yourself…',
    rows: 5,
    value: '',
    error: 'Unable to save bio. Please try again.',
  },
};

const MAX = 500;

const WithCharCounterTemplate = () => {
  const [value, setValue] = useState('');
  const remaining = MAX - value.length;

  return (
    <div className="flex flex-col gap-1.5">
      <EmojiTextarea
        label="Bio"
        placeholder="Tell something about yourself…"
        rows={5}
        value={value}
        maxLength={MAX}
        onChange={setValue}
      />
      <div className="flex justify-between">
        <span className="text-xs text-text-3">500 characters maximum.</span>
        <span
          className={[
            'text-xs tabular-nums',
            remaining < 50 ? 'text-error-fg' : 'text-text-3',
          ].join(' ')}
        >
          {remaining}
        </span>
      </div>
    </div>
  );
};

/** Interactive story showing a character counter alongside the emoji textarea. */
export const WithCharCounter: Story = {
  render: () => <WithCharCounterTemplate />,
};
