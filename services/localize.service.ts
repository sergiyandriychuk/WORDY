import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {take} from 'rxjs/operators';

import {LANG} from '@app/shared/constants';
import {Lang, PromiseResolve, SelectLang} from '@app/shared/models';

@Injectable()
export class LocalizeService {

  private readonly languages: Lang[] = ['en', 'uk'];
  private readonly defaultLang: Lang = 'en';

  private currentLanguage: Lang | null = null;
  private storage: Storage = window.localStorage;

  private onLangChangeSubject$: BehaviorSubject<Lang | null> = new BehaviorSubject<Lang | null>(null);
  public onLangChange$: Observable<Lang | null> = this.onLangChangeSubject$.asObservable();

  constructor(
    private translateService: TranslateService,
    private title: Title
  ) {
  }

  public get currentLang(): Lang | null {
    return this.currentLanguage;
  }

  public init(): void {
    const storageLang: Lang = <Lang>this.storage.getItem(LANG);

    if (this.languages.includes(storageLang)) {
      this.changeLanguage(storageLang);
      return;
    }

    const browserLang: string | null = this.translateService.getBrowserLang() || null;

    if (this.languages.includes(<Lang>browserLang)) {
      this.changeLanguage(<Lang>browserLang);
      return;
    }

    this.changeLanguage(this.defaultLang);
  }

  public changeLanguage(lang: Lang): void {
    if (!this.languages.includes(lang)) {
      lang = this.defaultLang;
    }

    this.storage.setItem(LANG, lang);
    this.translateService.setDefaultLang(lang);

    this.translateService.use(lang)
      .pipe(take(1))
      .subscribe(() => {
        this.title.setTitle(this.translate('APP.TITLE'));
        document.documentElement.setAttribute('lang', lang);
      });

    this.currentLanguage = lang;
    this.onLangChangeSubject$.next(lang);
  }

  public translate(key: string, interpolateParams?: Object): string {
    return this.translateService.instant(key, interpolateParams);
  }

  public async onLangLoad(): Promise<boolean> {
    try {
      if (this.translateService.store.translations[this.translateService.currentLang]) {
        return true;
      }

      return await new Promise((resolve: PromiseResolve<boolean>) => {
        this.translateService.onDefaultLangChange
          .pipe(take(1))
          .subscribe({
            next: () => {
              resolve(true);
            },
            error: () => {
              resolve(false);
            }
          });

        this.translateService.onLangChange
          .pipe(take(1))
          .subscribe({
            next: () => {
              resolve(true);
            },
            error: () => {
              resolve(false);
            }
          });
      });
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public getSelectLangs(): SelectLang[] {
    return [
      {
        code: 'en',
        localize: {
          en: 'English',
          uk: 'Англійська'
        }
      },
      {
        code: 'de',
        localize: {
          en: 'German',
          uk: 'Німецька'
        }
      },
      {
        code: 'es',
        localize: {
          en: 'Spanish',
          uk: 'Іспанська'
        }
      },
      {
        code: 'uk',
        localize: {
          en: 'Ukrainian',
          uk: 'Українська'
        }
      },
      {
        code: 'pl',
        localize: {
          en: 'Polish',
          uk: 'Польська'
        }
      },
      {
        code: 'fr',
        localize: {
          en: 'French',
          uk: 'Французька'
        }
      },
      {
        code: 'ru',
        localize: {
          en: 'Russian',
          uk: 'Російська'
        }
      },
      {
        code: 'ar',
        localize: {
          en: 'Arabic',
          uk: 'Арабська'
        }
      }
    ];
  }

}
