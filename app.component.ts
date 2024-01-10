import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';

import {AppService, FeedbackService, TokenService, UiService} from '@app/shared/services';
import {FeedbackData, FeedbackEvent} from '@app/shared/models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  public isShowLoader: boolean = false;
  public isSidenavInMobileMode: boolean = false;
  public isShowMobileSidenav: boolean = false;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    public uiSvc: UiService,
    public tokenSvc: TokenService,
    private appSvc: AppService,
    private feedbackSvc: FeedbackService
  ) {
    this.appSvc.initializeApp();
    this.initExtensionEvents();

    this.detectMobileScreen();

    this.uiSvc.isShowMobilSidenav$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isShow: boolean) => {
        this.isShowMobileSidenav = isShow;
      });
  }

  ngOnInit() {
    this.isShowLoader = true;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  public sidenavBackdropClickHandler(): void {
    this.uiSvc.setMobileSidenavVisible(false);
  }

  public sidenavKeydownHandler(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      this.uiSvc.setMobileSidenavVisible(false);
    }
  }

  private detectMobileScreen(): void {
    const isMobile: boolean = this.uiSvc.isMobileScreen();
    this.isSidenavInMobileMode = isMobile;
    this.uiSvc.setSidenavMode(isMobile);

    if (!isMobile && this.isShowMobileSidenav) {
      this.uiSvc.setMobileSidenavVisible(false);
    }
  }

  private initExtensionEvents(): void {
    document.addEventListener('init-feedback-data', ((event: CustomEvent<FeedbackEvent>) => {
      const feedbackData: FeedbackData | null = event?.detail?.feedbackData || null;
      this.feedbackSvc.initFeedbackData(feedbackData);
    }) as any);
  }

  @HostListener('window:resize')
  public onResizeScreen(): void {
    this.detectMobileScreen();
  }

}
