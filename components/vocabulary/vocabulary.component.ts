import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSelectChange} from '@angular/material/select';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatButtonToggleChange, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatInput} from '@angular/material/input';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {DialogService, LocalizeService, UserService, UtilsService, WordsService} from '@app/shared/services';
import {
  Alphabets,
  ExtensionLang,
  GetKnownWordsResponse,
  KnownWord,
  Lang,
  PaginationOptions,
  SelectLang,
  Translation,
  User
} from '@app/shared/models';
import {DEFAULT_LEARN_LANG, DEFAULT_MY_LANG, DEFAULT_PAGINATION_OPTIONS, EXTENSION_LANGS} from '@app/shared/constants';

@Component({
  selector: 'app-vocabulary',
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.scss']
})
export class VocabularyComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(MatPaginator, {static: true}) private paginator: MatPaginator | null = null;
  @ViewChild('group') private group: MatButtonToggleGroup | null = null;
  @ViewChild('searchInput') private searchInput: ElementRef<MatInput> | null = null;

  public vocabularyItems: KnownWord[] = [];
  public displayedItems: string[] = ['word', 'translation'];
  public myLangs: SelectLang[] = this.localizeSvc.getSelectLangs();
  public learnLangs: SelectLang[] = this.localizeSvc.getSelectLangs();
  public currentLang: Lang | null = this.localizeSvc.currentLang;
  public myLang: ExtensionLang = DEFAULT_MY_LANG;
  public learnLang: ExtensionLang = DEFAULT_LEARN_LANG;
  public loading: boolean = true;
  public isBlockUi: boolean = false;
  public hidePagination: boolean = true;
  public alphabets: Alphabets = this.utilsSvc.getAlphabets();
  public paginationOptions: PaginationOptions = DEFAULT_PAGINATION_OPTIONS;
  public isUserSubscriptionActive: boolean = false;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private selectedLetter: string | null = null;
  private toggleChanged: boolean = false;
  private search$: Subject<string> = new Subject<string>();
  private searchWord: string = '';

  constructor(
    private wordsSvc: WordsService,
    private utilsSvc: UtilsService,
    private dialogSvc: DialogService,
    private localizeSvc: LocalizeService,
    private userSvc: UserService
  ) {
  }

  async ngOnInit() {
    this.isUserSubscriptionActive = await this.userSvc.isUserSubscriptionActive();

    await this.loadMyLangs();
    this.removeRedundantSelectOptions();
    this.getKnownWords();

    this.localizeSvc.onLangChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang: Lang | null) => {
        this.currentLang = lang;
        this.changePaginationLabel();
      });

    this.search$
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe((res: string) => {
        this.searchWord = res;

        if (this.selectedLetter && this.searchWord) {
          const {searchWordFormatted, selectedLetterFormatted} = this.getFormattedParams();

          if (!searchWordFormatted.startsWith(selectedLetterFormatted!) && this.group) {
            this.group.value = null;
            this.selectedLetter = null;
            this.toggleChanged = false;
          }
        }

        this.getKnowWordsProcess(true);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.changePaginationLabel();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  private async getKnownWords(
    perPage: number = this.paginationOptions.pageSize,
    page: number = this.paginationOptions.pageIndex + 1,
    letter: string | null = this.selectedLetter,
    searchWord: string = this.searchWord,
    ignoreLoading: boolean = false
  ): Promise<void> {
    try {
      if (!ignoreLoading) {
        this.loading = true;
      }

      const words: GetKnownWordsResponse = await this.wordsSvc.getKnownWords(
        this.learnLang, this.myLang, perPage, page, letter, searchWord
      );

      this.hidePagination = !words.items.length;

      this.vocabularyItems = words.items.map((el: KnownWord) => ({
        ...el,
        uid: this.utilsSvc.getUniqueId(),
        translations: el.translations.sort((a: Translation, b: Translation) => a.confidence < b.confidence ? 1 : -1)
      }));

      this.paginationOptions.length = words.total;
    } catch (e) {
      this.vocabularyItems = [];
      this.hidePagination = true;
      console.error(e);
      await this.localizeSvc.onLangLoad();
      this.dialogSvc.warningDialog(
        this.localizeSvc.translate('DIALOGS.ERROR.GET_WORDS.TITLE'),
        this.utilsSvc.getErrorMessage(e)
      );
    } finally {
      if (!ignoreLoading) {
        this.loading = false;
      }
    }
  }

  private async getKnowWordsProcess(resetPageIndex?: boolean): Promise<void> {
    try {
      this.paginationOptions.disabled = true;
      this.isBlockUi = true;

      if (resetPageIndex) {
        this.paginationOptions.pageIndex = 0;
      }

      await this.getKnownWords(
        this.paginationOptions.pageSize,
        this.paginationOptions.pageIndex + 1,
        this.selectedLetter,
        this.searchWord, true
      );
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(
        this.localizeSvc.translate('DIALOGS.ERROR.GET_WORDS.TITLE'),
        this.utilsSvc.getErrorMessage(e)
      );
    } finally {
      this.paginationOptions.disabled = false;
      this.isBlockUi = false;
    }
  }

  public async removeItem(uid: string, translationId: number): Promise<void> {
    try {
      if (this.isBlockUi || !this.isUserSubscriptionActive) {
        return;
      }

      this.paginationOptions.disabled = true;
      this.isBlockUi = true;

      const knownWord: KnownWord | null = this.vocabularyItems.find((el: KnownWord) => el.uid === uid) || null;

      if (!knownWord) {
        throw new Error('Unknown word!');
      }

      const translationWord: Translation | null = knownWord.translations.find((el: Translation) => el.translationId === translationId) || null;

      if (!translationWord) {
        throw new Error('Unknown translation word!');
      }

      await this.wordsSvc.postDetachKnownWords(translationWord.translationId);

      const knownWordIdx: number = this.vocabularyItems.findIndex((el: KnownWord) => el.uid === uid);

      let hasKnownTranslations: boolean = false;

      if (knownWordIdx !== -1) {
        this.vocabularyItems[knownWordIdx].translations = this.vocabularyItems[knownWordIdx].translations.map((el: Translation) => {
          if (el.translationId === translationId) {
            el.known = false;
          }

          if (el.known) {
            hasKnownTranslations = true;
          }

          return el;
        });

        if (!hasKnownTranslations) {
          this.vocabularyItems = this.vocabularyItems.filter((el: KnownWord) => el.uid !== knownWord.uid);
        }
      }

      this.paginationOptions.disabled = false;
      this.isBlockUi = false;
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(
        this.localizeSvc.translate('DIALOGS.ERROR.GET_WORDS.TITLE'),
        this.utilsSvc.getErrorMessage(e)
      );

      this.paginationOptions.disabled = false;
      this.isBlockUi = false;
    }
  }

  public changeMyLang(event: MatSelectChange): void {
    if (event?.value) {
      this.myLang = event.value;
    }

    this.removeRedundantSelectOptions();

    this.getKnowWordsProcess(true);
  }

  public changeLearnLang(event: MatSelectChange): void {
    if (event?.value) {
      this.learnLang = event.value;

      this.selectedLetter = null;
      if (this.group) {
        this.group.value = null;
      }
    }

    this.removeRedundantSelectOptions();

    this.getKnowWordsProcess(true);
  }

  public async paginationChange(event: PageEvent): Promise<void> {
    this.paginationOptions.pageIndex = event.pageIndex;
    this.paginationOptions.pageSize = event.pageSize;
    this.paginationOptions.length = event.length;

    await this.getKnowWordsProcess();
  }

  private async changePaginationLabel(): Promise<void> {
    if (this.paginator) {
      await this.localizeSvc.onLangLoad();
      const pageSizeLabel: HTMLElement | null = this.utilsSvc.selector('.mat-paginator-page-size-label');
      if (pageSizeLabel) {
        pageSizeLabel.textContent = this.localizeSvc.translate('TEXT.ITEMS');
      }
    }
  }

  public async selectLetter(event: MatButtonToggleChange) {
    if (this.isBlockUi) {
      return;
    }

    this.toggleChanged = true;
    this.selectedLetter = event.value;

    if (this.searchWord && this.selectedLetter) {
      const {searchWordFormatted, selectedLetterFormatted} = this.getFormattedParams();

      if (!searchWordFormatted.startsWith(selectedLetterFormatted!)) {
        this.setSearchInputValue('');
        this.searchWord = '';
      }
    }

    await this.getKnowWordsProcess(true);
  }

  public async clickLetter() {
    if (!this.toggleChanged) {
      if (this.group) {
        this.group.value = null;
      }

      this.selectedLetter = null;

      await this.getKnowWordsProcess(true);
    }

    this.toggleChanged = false;
  }

  public async attachWord(uid: string, translationId: number): Promise<void> {
    try {
      if (this.isBlockUi || !this.isUserSubscriptionActive) {
        return;
      }

      this.paginationOptions.disabled = true;
      this.isBlockUi = true;

      const knownWord: KnownWord | null = this.vocabularyItems.find((el: KnownWord) => el.uid === uid) || null;

      if (!knownWord) {
        throw new Error('Unknown word!');
      }

      const translationWord: Translation | null = knownWord.translations.find((el: Translation) => el.translationId === translationId) || null;

      if (!translationWord) {
        throw new Error('Unknown translation word!');
      }

      await this.wordsSvc.postAttachKnownWords(translationWord.translationId);

      const knownWordIdx: number = this.vocabularyItems.findIndex((el: KnownWord) => el.uid === uid);

      if (knownWordIdx !== -1) {
        this.vocabularyItems[knownWordIdx].translations = this.vocabularyItems[knownWordIdx].translations.map((el: Translation) => {
          if (el.translationId === translationId) {
            el.known = true;
          }

          return el;
        });
      }

      this.paginationOptions.disabled = false;
      this.isBlockUi = false;
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(
        this.localizeSvc.translate('DIALOGS.ERROR.GET_WORDS.TITLE'),
        this.utilsSvc.getErrorMessage(e)
      );
      this.paginationOptions.disabled = false;
      this.isBlockUi = false;
    }
  }

  public search(event: any): void {
    this.search$.next(event?.target?.value || '');
  }

  private setSearchInputValue(value: string): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.value = value;
    }
  }

  private getFormattedParams() {
    const searchWordFormatted: string = this.searchWord.trim().toLowerCase();
    const selectedLetterFormatted: string | undefined = this.selectedLetter?.trim()?.toLowerCase();

    return {
      searchWordFormatted,
      selectedLetterFormatted
    };
  }

  private async loadMyLangs(): Promise<void> {
    try {
      const user: User | null = await this.userSvc.getUserData();
      const learnLang: ExtensionLang = EXTENSION_LANGS[user!.from as ExtensionLang];
      const myLang: ExtensionLang = EXTENSION_LANGS[user!.to as ExtensionLang];

      if (learnLang) {
        this.learnLang = learnLang;
      }

      if (myLang) {
        this.myLang = myLang;
      }
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
    }
  }

  private removeRedundantSelectOptions(): void {
    this.myLangs = this.localizeSvc.getSelectLangs().filter((el: SelectLang) => el.code !== this.learnLang);
    this.learnLangs = this.localizeSvc.getSelectLangs().filter((el: SelectLang) => el.code !== this.myLang);
  }

}
