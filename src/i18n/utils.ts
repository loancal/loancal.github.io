import { DEFAULT_LOCALE, LOCALES, type Locale } from './translations';

export function getLocaleFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (lang && LOCALES.some((l) => l.code === lang)) {
    return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

export function getLocalizedPath(path: string, locale: Locale): string {
  // Strip existing locale prefix if present
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && LOCALES.some((l) => l.code === segments[0])) {
    segments.shift();
  }
  const cleanPath = segments.join('/');

  if (locale === DEFAULT_LOCALE) {
    return cleanPath ? `/${cleanPath}/` : '/';
  }
  return cleanPath ? `/${locale}/${cleanPath}/` : `/${locale}/`;
}

export function formatCurrency(
  value: number,
  currencySymbol: string = '$',
  locale: string = 'en-US',
  maximumFractionDigits: number = 2
): string {
  if (isNaN(value) || !isFinite(value)) return `${currencySymbol}0`;

  // For Japanese Yen, typically zero decimal places
  const fractionDigits = currencySymbol === '¥' ? 0 : maximumFractionDigits;

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

  // Position currency symbol properly
  if (currencySymbol === '€') {
    return `${formattedNumber} €`;
  }
  return `${currencySymbol}${formattedNumber}`;
}
