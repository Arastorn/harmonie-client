import {
  Clock3,
  Flag,
  Hash,
  Leaf,
  Lightbulb,
  Plane,
  Trophy,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import EmojiPicker, { Categories, SuggestionMode, type PickerProps } from 'emoji-picker-react';
import emojisFr from 'emoji-picker-react/dist/data/emojis-fr';
import emojisEn from 'emoji-picker-react/dist/data/emojis-en';

const categoryIcons = {
  [Categories.SUGGESTED]: <Clock3 size={14} strokeWidth={2.25} />,
  [Categories.SMILEYS_PEOPLE]: <Users size={14} strokeWidth={2.25} />,
  [Categories.ANIMALS_NATURE]: <Leaf size={14} strokeWidth={2.25} />,
  [Categories.FOOD_DRINK]: <UtensilsCrossed size={14} strokeWidth={2.25} />,
  [Categories.TRAVEL_PLACES]: <Plane size={14} strokeWidth={2.25} />,
  [Categories.ACTIVITIES]: <Trophy size={14} strokeWidth={2.25} />,
  [Categories.OBJECTS]: <Lightbulb size={14} strokeWidth={2.25} />,
  [Categories.SYMBOLS]: <Hash size={14} strokeWidth={2.25} />,
  [Categories.FLAGS]: <Flag size={14} strokeWidth={2.25} />,
};

function getLocaleEmojiData() {
  const lang =
    (typeof document !== 'undefined' && document.documentElement.lang) ||
    (typeof navigator !== 'undefined' ? navigator.language : '') ||
    'en';
  return lang.toLowerCase().startsWith('fr') ? emojisFr : emojisEn;
}

export type EmojiPickerBaseProps = Omit<PickerProps, 'categoryIcons'>;

export const EmojiPickerBase = ({
  emojiData,
  width = 320,
  height = 380,
  ...props
}: EmojiPickerBaseProps) => (
  <EmojiPicker
    className="channel-emoji-picker"
    emojiData={emojiData ?? getLocaleEmojiData()}
    searchDisabled
    autoFocusSearch={false}
    lazyLoadEmojis
    skinTonesDisabled
    suggestedEmojisMode={SuggestionMode.RECENT}
    previewConfig={{ showPreview: false }}
    categoryIcons={categoryIcons}
    width={width}
    height={height}
    {...props}
  />
);
