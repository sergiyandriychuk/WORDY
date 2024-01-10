import {Injectable} from '@angular/core';
import {ngxLoadingAnimationTypes, NgxLoadingConfig} from 'ngx-loading';
import {BehaviorSubject, Observable} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

@Injectable()
export class UiService {

  private _isShowLoading: boolean = false;

  private readonly _loadingConfig: Readonly<NgxLoadingConfig> = {
    animationType: ngxLoadingAnimationTypes.threeBounce,
    backdropBackgroundColour: 'var(--mainGreenColor)',
    primaryColour: 'var(--mainBgColor)'
  };

  private _isSidenavInMobileMode$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isSidenavInMobileMode$: Observable<boolean> = this._isSidenavInMobileMode$.asObservable().pipe(distinctUntilChanged());

  private _isShowMobilSidenav$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isShowMobilSidenav$: Observable<boolean> = this._isShowMobilSidenav$.asObservable().pipe(distinctUntilChanged());

  constructor() {
  }

  public get isShowLoading(): boolean {
    return this._isShowLoading;
  }

  public get loadingConfig(): Readonly<NgxLoadingConfig> {
    return this._loadingConfig;
  }

  public showLoading(): void {
    this._isShowLoading = true;
  }

  public hideLoading(): void {
    this._isShowLoading = false;
  }

  public isMobileScreen(): boolean {
    if (window.innerWidth < 600) {
      return true;
    } else {
      return false;
    }
  }

  public setSidenavMode(isMobile: boolean): void {
    this._isSidenavInMobileMode$.next(isMobile);
  }

  public setMobileSidenavVisible(visible: boolean): void {
    this._isShowMobilSidenav$.next(visible);
  }

  public mobileSidenavToggle(): void {
    const value: boolean = this._isShowMobilSidenav$.getValue();
    this._isShowMobilSidenav$.next(!value);
  }

}
