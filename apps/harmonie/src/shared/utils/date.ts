import { format, formatRelative } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import type { TFunction } from 'i18next';

const isFrench = (language?: string) => language?.toLowerCase().startsWith('fr');

const getLocale = (language?: string) => (isFrench(language) ? fr : enUS);

export const formatContextualDateTime = (
  iso: string,
  language: string | undefined,
  t: TFunction
) => {
  const date = new Date(iso);
  const now = new Date();
  const locale = getLocale(language);
  const relative = formatRelative(date, now, { locale, weekStartsOn: 1 });
  const dateOnly = format(date, 'P', { locale });

  if (relative === dateOnly) {
    return t('dateTime.dateAt', {
      date: format(date, 'PPP', { locale }),
      time: format(date, 'p', { locale }),
    });
  }

  return relative;
};
