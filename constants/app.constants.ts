import {MatDialogConfig} from '@angular/material/dialog';
import {IndividualConfig} from 'ngx-toastr';

import {ExtensionLang, PaginationOptions} from '@app/shared/models';

export const matDialogRemove: Readonly<MatDialogConfig> = {
  width: '380px',
  panelClass: 'matDialogRemove'
};

export const defaultToastConfig: Readonly<Partial<IndividualConfig>> = {
  timeOut: 3000,
  progressBar: true,
  progressAnimation: 'increasing'
};

export const EXTENSION_LANGS: { [key in ExtensionLang]: ExtensionLang } = {
  en: 'en',
  de: 'de',
  es: 'es',
  uk: 'uk',
  pl: 'pl',
  fr: 'fr',
  ru: 'ru',
  ar: 'ar'
};

export const DEFAULT_MY_LANG: ExtensionLang = 'uk';
export const DEFAULT_LEARN_LANG: ExtensionLang = 'en';

export const DEFAULT_PAGINATION_OPTIONS: PaginationOptions = {
  pageSizeOptions: [100, 250, 500],
  pageIndex: 0,
  length: 0,
  pageSize: 100,
  disabled: false,
  showFirstLastButtons: true,
  hidePageSize: false
};
