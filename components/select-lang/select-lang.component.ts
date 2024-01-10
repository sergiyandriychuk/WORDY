import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';

import {LocalizeService, UtilsService} from '@app/shared/services';
import {Lang} from '@app/shared/models';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-select-lang',
  templateUrl: './select-lang.component.html',
  styleUrls: ['./select-lang.component.scss']
})
export class SelectLangComponent implements OnInit, OnDestroy {

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private localizeSvc: LocalizeService,
    private utilsSvc: UtilsService
  ) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  public setCurrentLanguage(lang: Lang): void {
    this.localizeSvc.changeLanguage(lang);
  }

  public onMenuOpened(btn: MatButton): void {
    const elem: HTMLElement | null = this.utilsSvc.selector('.selectLang__menu.mat-menu-panel');
    if (elem) {
      elem.style.width = btn._elementRef.nativeElement.offsetWidth + 'px';
    }
  }

}
