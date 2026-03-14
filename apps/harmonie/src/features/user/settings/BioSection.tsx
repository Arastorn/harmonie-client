import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmojiTextarea } from '@harmonie/ui';
import type { UserProfile } from '@/types/user';
import { patchMe } from '@/api/users';

const BIO_MAX_LENGTH = 500;

interface BioSectionProps {
  user: UserProfile | null;
  updateUser: (user: UserProfile) => void;
}

export const BioSection = ({ user, updateUser }: BioSectionProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(user?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  const currentBio = user?.bio ?? '';
  const isDirty = draft !== currentBio;
  const remaining = BIO_MAX_LENGTH - draft.length;

  const handleSave = async () => {
    setIsSaving(true);
    setError(false);
    try {
      const updated = await patchMe({ bio: draft.trim() || null });
      updateUser(updated);
      setDraft(updated.bio ?? '');
    } catch {
      setError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(currentBio);
    setError(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <EmojiTextarea
          label={t('settings.bio.label')}
          value={draft}
          onChange={setDraft}
          maxLength={BIO_MAX_LENGTH}
          rows={5}
          disabled={isSaving}
          placeholder={t('settings.bio.placeholder')}
          error={error ? t('settings.bio.error') : undefined}
        />
        <div className="flex justify-between">
          <p className="text-xs text-text-3">{t('settings.bio.hint')}</p>
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

      <div className="flex self-start gap-2">
        <Button onClick={handleSave} disabled={isSaving || !isDirty}>
          {t('settings.bio.save')}
        </Button>
        {isDirty && (
          <Button variant="tertiary" onClick={handleCancel} disabled={isSaving}>
            {t('settings.bio.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
};
