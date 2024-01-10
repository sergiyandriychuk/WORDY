import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {environment} from '@src/environments/environment';

@Injectable()
export class ApiService {

  constructor(
    private http: HttpClient
  ) {
  }

  private static formatErrors(error: any): Observable<never> {
    return throwError(error.error);
  }

  public get(path: string, params: HttpParams = new HttpParams()): Observable<any> {
    return this.http.get(`${environment.apiUrl}${path}`, {params})
      .pipe(catchError(ApiService.formatErrors));
  }

  public put(path: string, body: object = {}): Observable<any> {
    return this.http.put(`${environment.apiUrl}${path}`, JSON.stringify(body))
      .pipe(catchError(ApiService.formatErrors));
  }

  public post(path: string, body: object = {}): Observable<any> {
    return this.http.post(`${environment.apiUrl}${path}`, JSON.stringify(body))
      .pipe(catchError(ApiService.formatErrors));
  }

  public delete(path: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}${path}`)
      .pipe(catchError(ApiService.formatErrors));
  }

}
