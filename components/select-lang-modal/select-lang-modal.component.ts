import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

import {Lang} from '@app/shared/models';
import {LocalizeService} from '@app/shared/services';

interface LangListItem {
  lang: Lang;
  localize: {
    [key in Lang]: string
  };
}

@Component({
  selector: 'app-select-lang-modal',
  templateUrl: './select-lang-modal.component.html',
  styleUrls: ['./select-lang-modal.component.scss']
})
export class SelectLangModalComponent implements OnInit, OnDestroy {

  public currentLang: Lang | null = this.localizeSvc.currentLang;

  public langs: LangListItem[] = [
    {
      lang: 'uk',
      localize: {
        en: 'Ukrainian',
        uk: 'Українська'
      }
    },
    {
      lang: 'en',
      localize: {
        en: 'English',
        uk: 'Англійська'
      }
    }
  ];

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    public dialogRef: MatDialogRef<SelectLangModalComponent>,
    private localizeSvc: LocalizeService
  ) {
  }

  ngOnInit() {
    this.localizeSvc.onLangChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang: Lang | null) => {
        this.currentLang = lang;
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  public setCurrentLanguage(lang: LangListItem): void {
    this.localizeSvc.changeLanguage(lang.lang);
    this.dialogRef.close();
  }

}

