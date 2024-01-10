import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';

import {TranslateModule} from '@ngx-translate/core';
import {NgxLoadingModule} from 'ngx-loading';

import {MaterialModule} from '@app/shared/material/material.module';
import {
  ApiService,
  AppService,
  DialogService,
  FeedbackService,
  FormService,
  LocalizeService,
  RequestsService,
  StorageService,
  TokenService,
  UiService,
  UserService,
  UtilsService,
  WordsService
} from '@app/shared/services';
import {
  AuthComponent,
  BankCardComponent,
  BillingComponent,
  FeedbackComponent,
  FooterComponent,
  HeaderComponent,
  LinkWrapperComponent,
  OopsComponent,
  PaymentFailedComponent,
  PaymentSuccessfulComponent,
  RemoveModalComponent,
  SelectLangComponent,
  SelectLangModalComponent,
  SidenavComponent,
  SimpleInputComponent,
  SimpleTextareaComponent,
  SpinnerComponent,
  SvgIconComponent,
  UrlsLibraryComponent,
  VocabularyComponent
} from '@app/shared/components';
import {LoginGuard, UserGuard} from '@app/shared/guards';
import {CurrencySymbolPipe, PaymentStatusPipe, SubscriptionStatusPipe} from '@app/shared/pipes';

const components = [
  VocabularyComponent,
  HeaderComponent,
  SelectLangComponent,
  RemoveModalComponent,
  SelectLangModalComponent,
  SimpleInputComponent,
  AuthComponent,
  FooterComponent,
  LinkWrapperComponent,
  UrlsLibraryComponent,
  FeedbackComponent,
  SimpleTextareaComponent,
  BillingComponent,
  SidenavComponent,
  SvgIconComponent,
  PaymentSuccessfulComponent,
  PaymentFailedComponent,
  OopsComponent,
  SpinnerComponent,
  BankCardComponent
];

const services = [
  UtilsService,
  StorageService,
  LocalizeService,
  AppService,
  ApiService,
  WordsService,
  DialogService,
  TokenService,
  UserService,
  UiService,
  FormService,
  FeedbackService,
  RequestsService
];

const guards = [
  LoginGuard,
  UserGuard
];

const modules = [
  MaterialModule,
  ReactiveFormsModule,
  FormsModule,
  RouterModule
];

const pipes = [
  PaymentStatusPipe,
  CurrencySymbolPipe,
  SubscriptionStatusPipe
];

@NgModule({
  declarations: [
    components,
    pipes
  ],
  imports: [
    CommonModule,
    TranslateModule,
    NgxLoadingModule,
    modules
  ],
  exports: [
    modules,
    components
  ],
  providers: [
    services,
    guards,
    pipes
  ]
})
export class SharedModule {
}
