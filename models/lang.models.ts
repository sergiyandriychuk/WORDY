export type Lang = 'en' | 'uk'

export type ExtensionLang = 'en' | 'de' | 'es' | 'fr' | 'pl' | 'uk' | 'ru' | 'ar'

export interface SelectLang {
  code: string;
  localize: {
    en: string
    uk: string
  };
}

export type Alphabets = {
  [key in ExtensionLang]: string[]
}
