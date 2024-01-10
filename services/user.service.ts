import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

import {ApiService} from '@app/shared/services/api.service';
import {TokenService} from '@app/shared/services/token.service';
import {UtilsService} from '@app/shared/services/utils.service';
import {
  PostFeedbackBody,
  PostLoginBody,
  PostLoginResponse,
  PostRegisterBody,
  PostRegisterResponse,
  User,
  UserSubscription
} from '@app/shared/models';
import {RequestsService} from '@app/shared/services/requests.service';

@Injectable()
export class UserService {

  private _currentUser$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this._currentUser$.asObservable().pipe(distinctUntilChanged());

  constructor(
    private apiSvc: ApiService,
    private tokenSvc: TokenService,
    private utilsSvc: UtilsService,
    private requestsSvc: RequestsService,
    private router: Router
  ) {
  }

  public async googleLogin(accessToken: string): Promise<PostLoginResponse> {
    return firstValueFrom(this.apiSvc.post(`/auth/provider/login`, {
      provider: 'google',
      accessToken
    }));
  }

  public async populate(): Promise<void> {
    try {
      const token: string | null = this.tokenSvc.getToken();

      if (!token) {
        return;
      }

      const user: User | null = await this.getUserData();

      if (!user) {
        throw new Error('User not found!');
      }
    } catch (e) {
      console.error(e);
      this.logout();
    }
  }

  public isUserSubscriptionExpires(userSubscription: UserSubscription): boolean {
    try {
      if (!userSubscription?.nextPaymentDate) {
        return true;
      }

      const nextPaymentDate: Date = new Date(userSubscription.nextPaymentDate);

      if (!this.utilsSvc.dateIsValid(nextPaymentDate)) {
        return true;
      }

      const currentDate: Date = new Date();

      return currentDate.getTime() > nextPaymentDate.getTime();
    } catch (e) {
      console.error(e);
      return true;
    }
  }

  public async isUserSubscriptionActive(subscription?: UserSubscription): Promise<boolean> {
    try {
      let userSubscription: UserSubscription;

      if (subscription) {
        userSubscription = subscription;
      } else {
        userSubscription = await this.requestsSvc.findSubscription();
      }

      const isExpires = this.isUserSubscriptionExpires(userSubscription);
      if (isExpires) {
        return false;
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public async getUserData(): Promise<User | null> {
    try {
      if (this._currentUser$.value?.id) {
        return this.utilsSvc.objectClone(this._currentUser$.value);
      } else {
        const user: User = (await this.getCurrentUser());
        this._currentUser$.next(user);
        return this._currentUser$.value;
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  public async logout(): Promise<void> {
    await this.logoutFromApi();
    this.destroyUser();
    await this.router.navigate(['login']);
  }

  private destroyUser(): void {
    this.tokenSvc.destroyToken();
    this._currentUser$.next(null);
  }

  private async getCurrentUser(): Promise<User> {
    return firstValueFrom(this.apiSvc.get(`/users`));
  }

  private async logoutFromApi(): Promise<void> {
    try {
      await firstValueFrom(this.apiSvc.post(`/auth/logout`));
    } catch (e) {
      console.error(e);
    }
  }

  public async login(body: PostLoginBody): Promise<PostLoginResponse> {
    return firstValueFrom(this.apiSvc.post(`/auth/login`, body));
  }

  public async register(body: PostRegisterBody): Promise<PostRegisterResponse> {
    return firstValueFrom(this.apiSvc.post(`/auth/register`, body));
  }

  public async sendFeedback(body: PostFeedbackBody): Promise<void> {
    return firstValueFrom(this.apiSvc.post(`/feedbacks`, body));
  }

}
