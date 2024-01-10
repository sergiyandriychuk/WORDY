import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';

import {TokenService} from '@app/shared/services';

@Injectable()
export class LoginGuard implements CanActivate {

  constructor(
    private tokenSvc: TokenService,
    private router: Router
  ) {
  }

  public canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.tokenSvc.getToken()) {
      this.router.navigate(['vocabulary']);
      return false;
    } else {
      return true;
    }
  }

}
