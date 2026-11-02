import { en } from "./en";
import { ar } from "./ar";

export type Locale = "en" | "ar";
export type TranslationDict = typeof en;

export const dictionaries = {
  en,
  ar,
};

export function getDictionary(locale: Locale): TranslationDict {
  return dictionaries[locale] || dictionaries.en;
}
