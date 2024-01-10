import {Injectable} from '@angular/core';

import {LANG, USER_TOKEN, USER_TOKEN_LIFE} from '@app/shared/constants';
import {StorageService} from '@app/shared/services/storage.service';

@Injectable()
export class TokenService {

  private _userHasToken: boolean = false;

  constructor(
    private storageSvc: StorageService
  ) {
  }

  public get userHasToken(): boolean {
    return this._userHasToken;
  }

  public getToken(): string | null {
    const expDate: Date = new Date(this.storageSvc.get(USER_TOKEN_LIFE));

    if (new Date() > expDate) {
      this.destroyToken();
      return null;
    }

    const token: string = this.storageSvc.get(USER_TOKEN);
    this._userHasToken = !!token;
    return token;
  }

  public setToken(token: string | null): void {
    if (token) {
      const expDate: Date = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
      this.storageSvc.set(USER_TOKEN, token);
      this.storageSvc.set(USER_TOKEN_LIFE, expDate.toString());
      this._userHasToken = true;
    } else {
      const lang: string = this.storageSvc.get(LANG);
      window.localStorage.clear();
      this.storageSvc.set(LANG, lang);
      this._userHasToken = false;
    }
  }

  public destroyToken(): void {
    this._userHasToken = false;
    this.setToken(null);
  }

  public extractAccessToken(redirectUri: string): string | null {
    try {
      if (!redirectUri) {
        return null;
      }

      const m: RegExpMatchArray | null = redirectUri.match(/[#?](.*)/);
      if (!m || m.length < 1) {
        return null;
      }

      let params: URLSearchParams = new URLSearchParams(m[1].split('#')[0]);
      return params.get('access_token');
    } catch (e) {
      console.error(e);
      return null;
    }
  }

}
