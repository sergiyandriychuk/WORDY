import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {Subject, takeUntil} from 'rxjs';

import {TokenService, UiService, UserService, UtilsService} from '@app/shared/services';
import {User} from '@app/shared/models';
import {SelectLangModalComponent} from '@app/shared/components';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  public userName: string | null = null;
  public userAvatar: string | null = null;
  public headerHasShadow: boolean = false;
  public isHeaderMobile: boolean = false;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    public dialog: MatDialog,
    public tokenSvc: TokenService,
    private userSvc: UserService,
    private utilsSvc: UtilsService,
    private uiSvc: UiService
  ) {
  }

  ngOnInit() {
    this.getUserInfo();

    this.uiSvc.isSidenavInMobileMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isMobile: boolean) => {
        this.isHeaderMobile = isMobile;
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  public logout(): void {
    this.userSvc.logout();
  }

  private async getUserInfo(): Promise<void> {
    if (this.tokenSvc.userHasToken) {
      const user: User | null = await this.userSvc.getUserData();
      this.userName = user?.name || null;
      this.userAvatar = user?.avatar || null;
    }

    this.userSvc.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: User | null) => {
        this.userName = res?.name || null;
        this.userAvatar = res?.avatar || null;
      });
  }

  public openSelectLangModal(): void {
    this.dialog.open(SelectLangModalComponent);
  }

  public onMenuOpened(btn: MatButton): void {
    const elem: HTMLElement | null = this.utilsSvc.selector('.userCard__menu.mat-menu-panel');
    if (elem) {
      elem.style.width = btn._elementRef.nativeElement.offsetWidth + 'px';
    }
  }

  public sidenavToggle(): void {
    if (this.isHeaderMobile) {
      this.uiSvc.mobileSidenavToggle();
    }
  }

}
