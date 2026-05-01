import type { MessageReaction } from '@/types/channel';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
}

export const MessageReactions = ({ reactions, onToggle }: MessageReactionsProps) => {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggle(reaction.emoji)}
          className={[
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-colors cursor-pointer',
            reaction.reactedByMe
              ? 'bg-primary/20 border-primary/50 text-text-1'
              : 'bg-surface-2 border-border-2 text-text-2 hover:bg-surface-hover',
          ].join(' ')}
        >
          <span className="text-base leading-none">{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
};
