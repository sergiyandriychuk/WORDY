import {LOCALE_ID, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {HttpTokenInterceptor} from '@app/shared/interceptors';
import {DatePipe, registerLocaleData} from '@angular/common';
import localeUk from '@angular/common/locales/uk';

import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {ToastrModule} from 'ngx-toastr';
import {NgxLoadingModule} from 'ngx-loading';

import {AppRoutingModule} from '@app/app-routing.module';
import {SharedModule} from '@app/shared/shared.module';
import {AppComponent} from '@app/app.component';

export const HttpLoaderFactory = (http: HttpClient) => {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json?cache=' + (new Date().getTime()));
};

registerLocaleData(localeUk);

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    NgxLoadingModule.forRoot({})
  ],
  providers: [
    DatePipe,
    {provide: HTTP_INTERCEPTORS, useClass: HttpTokenInterceptor, multi: true},
    {provide: LOCALE_ID, useValue: 'uk-UA'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
