import { useTranslation } from 'react-i18next';
import { Button, EmojiInput } from '@harmonie/ui';
import type { Guild } from '@/types/guild';
import { useGuildForm } from '@/features/guild/form/useGuildForm';
import { GuildLogoPicker } from '@/features/guild/form/GuildLogoPicker';

interface GuildFormProps {
  mode?: 'create' | 'edit';
  guild?: Guild;
  autoFocus?: boolean;
  onUpdated?: (guild: Guild) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const GuildForm = ({
  mode = 'create',
  guild,
  autoFocus = false,
  onUpdated,
  onCancel,
  onSuccess,
}: GuildFormProps) => {
  const { t } = useTranslation();
  const isEditMode = mode === 'edit';
  const {
    name,
    setName,
    selectedIcon,
    setSelectedIcon,
    iconColor,
    setIconColor,
    iconBg,
    setIconBg,
    isLoading,
    error,
    setError,
    fileInputRef,
    logoPreview,
    effectiveRemoteLogoPreview,
    hasAnyImage,
    trimmedName,
    hasEditChanges,
    handleImageChange,
    handleImageDelete,
    handleSubmit,
  } = useGuildForm({ mode, guild, onUpdated, onSuccess });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full h-full">
      <EmojiInput
        label={t('guild.noGuild.nameLabel')}
        placeholder={t('guild.noGuild.namePlaceholder')}
        value={name}
        onChange={(nextValue) => {
          setName(nextValue);
          setError(false);
        }}
        error={error ? t(isEditMode ? 'guild.edit.error' : 'guild.noGuild.error') : undefined}
        disabled={isLoading}
        autoFocus={autoFocus}
      />
      <GuildLogoPicker
        fileInputRef={fileInputRef}
        logoPreview={logoPreview}
        effectiveRemoteLogoPreview={effectiveRemoteLogoPreview}
        isLoading={isLoading}
        name={name}
        selectedIcon={selectedIcon}
        onSelectIcon={setSelectedIcon}
        iconColor={iconColor}
        onSelectColor={setIconColor}
        iconBg={iconBg}
        onSelectBg={setIconBg}
        hasAnyImage={hasAnyImage}
        onImageChange={handleImageChange}
        onImageDelete={handleImageDelete}
      />
      <div className="flex justify-end">
        <div className="flex gap-2">
          {isEditMode && onCancel && (
            <Button type="button" variant="tertiary" onClick={onCancel} disabled={isLoading}>
              {t('guild.edit.cancel')}
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={trimmedName.length < 3 || (isEditMode && !hasEditChanges)}
          >
            {t(isEditMode ? 'guild.edit.save' : 'guild.noGuild.createButton')}
          </Button>
        </div>
      </div>
    </form>
  );
};
