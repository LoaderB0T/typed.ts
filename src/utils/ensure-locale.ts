import { keyboards } from '../data/keyboards.js';

export const ensureLocale = (locale: string) => {
  if (!keyboards[locale]) {
    throw new Error(`Locale ${locale} is not known`);
  }
};
