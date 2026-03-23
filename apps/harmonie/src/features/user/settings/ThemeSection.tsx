import { useTranslation } from 'react-i18next';
import { RadioCard } from '@harmonie/ui';
import { patchMe } from '@/api/users';
import { useTheme, THEMES, type Theme } from '../ThemeContext';
import { useUser } from '../UserContext';

export const ThemeSection = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { updateUser } = useUser();

  const handleChange = (newTheme: Theme) => {
    setTheme(newTheme);
    void patchMe({ theme: newTheme }).then(updateUser);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t('settings.theme.label')}</p>
      {THEMES.map((themeOption) => (
        <RadioCard
          key={themeOption}
          name="theme"
          value={themeOption}
          checked={theme === themeOption}
          onChange={() => handleChange(themeOption)}
        >
          {t(`settings.theme.${themeOption}`)}
        </RadioCard>
      ))}
    </div>
  );
};
