import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';

import {TokenService} from '@app/shared/services';

@Injectable()
export class UserGuard implements CanActivate {

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
      return true;
    } else {
      this.router.navigate(['login']);
      return false;
    }
  }

}
