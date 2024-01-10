import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';

import {environment} from '@src/environments/environment';
import {HeadersConfig} from '@app/shared/models';
import {TokenService} from '@app/shared/services';

@Injectable()
export class HttpTokenInterceptor implements HttpInterceptor {

  constructor(
    private tokenSvc: TokenService
  ) {
  }

  public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.includes(environment.apiUrl)) {
      const headersConfig: HeadersConfig = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const token: string | null = this.tokenSvc.getToken();

      if (token) {
        headersConfig['Authorization'] = `Bearer ${token}`;
      }

      request = request.clone({
        setHeaders: headersConfig
      });

      return next.handle(request);
    } else {
      return next.handle(request);
    }
  }

}
