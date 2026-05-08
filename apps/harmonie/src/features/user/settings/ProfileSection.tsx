import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, PlainEmojiTextarea } from '@harmonie/ui';
import type { UserProfile } from '@/types/user';
import { patchMe } from '@/api/users';

const DISPLAY_NAME_MAX_LENGTH = 50;
const BIO_MAX_LENGTH = 500;

interface ProfileSectionProps {
  user: UserProfile | null;
  updateUser: (user: UserProfile) => void;
}

export const ProfileSection = ({ user, updateUser }: ProfileSectionProps) => {
  const { t } = useTranslation();
  const [displayNameDraft, setDisplayNameDraft] = useState(user?.displayName ?? '');
  const [bioDraft, setBioDraft] = useState(user?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  const currentDisplayName = user?.displayName ?? '';
  const currentBio = user?.bio ?? '';
  const isDirty = displayNameDraft !== currentDisplayName || bioDraft !== currentBio;
  const remainingDisplayName = DISPLAY_NAME_MAX_LENGTH - displayNameDraft.length;
  const remainingBio = BIO_MAX_LENGTH - bioDraft.length;

  useEffect(() => {
    setDisplayNameDraft(user?.displayName ?? '');
    setBioDraft(user?.bio ?? '');
    setError(false);
  }, [user?.bio, user?.displayName]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(false);
    try {
      const updated = await patchMe({
        displayName: displayNameDraft.trim() || null,
        bio: bioDraft.trim() || null,
      });
      updateUser(updated);
      setDisplayNameDraft(updated.displayName ?? '');
      setBioDraft(updated.bio ?? '');
    } catch {
      setError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayNameDraft(currentDisplayName);
    setBioDraft(currentBio);
    setError(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Input
          label={t('settings.profile.displayNameLabel')}
          value={displayNameDraft}
          onChange={(event) => setDisplayNameDraft(event.target.value)}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          disabled={isSaving}
          placeholder={t('settings.profile.displayNamePlaceholder')}
          error={error ? t('settings.profile.error') : undefined}
        />
        <div className="flex justify-between">
          <p className="text-xs text-text-3">{t('settings.profile.displayNameHint')}</p>
          <span
            className={[
              'text-xs tabular-nums',
              remainingDisplayName < 10 ? 'text-error-fg' : 'text-text-3',
            ].join(' ')}
          >
            {remainingDisplayName}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <PlainEmojiTextarea
          label={t('settings.profile.label')}
          value={bioDraft}
          onChange={setBioDraft}
          maxLength={BIO_MAX_LENGTH}
          rows={5}
          disabled={isSaving}
          placeholder={t('settings.profile.placeholder')}
        />
        <div className="flex justify-between">
          <p className="text-xs text-text-3">{t('settings.profile.hint')}</p>
          <span
            className={[
              'text-xs tabular-nums',
              remainingBio < 50 ? 'text-error-fg' : 'text-text-3',
            ].join(' ')}
          >
            {remainingBio}
          </span>
        </div>
      </div>

      <div className="flex self-start gap-2">
        <Button onClick={handleSave} disabled={isSaving || !isDirty}>
          {t('settings.profile.save')}
        </Button>
        {isDirty && (
          <Button variant="tertiary" onClick={handleCancel} disabled={isSaving}>
            {t('settings.profile.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
};
