export interface KnownWord {
  id: number;
  langCode: string;
  word: string;
  translations: Translation[];
  ignore?: boolean;
  fault?: boolean;
  approved?: boolean;

  uid?: string;
}

export interface Translation {
  id: number;
  translationId: number;
  langCode: string;
  word: string;
  confidence: number;
  known: boolean;
  ignore?: boolean;
}
