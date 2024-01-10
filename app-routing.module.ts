import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {
  AuthComponent,
  BillingComponent,
  FeedbackComponent,
  PaymentFailedComponent,
  PaymentSuccessfulComponent,
  UrlsLibraryComponent,
  VocabularyComponent
} from '@app/shared/components';
import {LoginGuard, UserGuard} from '@app/shared/guards';

const routes: Routes = [
  {
    path: 'vocabulary',
    component: VocabularyComponent,
    canActivate: [UserGuard]
  },
  {
    path: 'urls-library',
    component: UrlsLibraryComponent,
    canActivate: [UserGuard]
  },
  {
    path: 'feedback',
    component: FeedbackComponent,
    canActivate: [UserGuard]
  },
  {
    path: 'billing',
    component: BillingComponent,
    canActivate: [UserGuard]
  },
  {
    path: 'payment-successful',
    component: PaymentSuccessfulComponent,
    canActivate: [UserGuard]
  },
  {
    path: 'payment-failed',
    component: PaymentFailedComponent,
    canActivate: [UserGuard]
  },
  {
    path: 'login',
    component: AuthComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'auth-with-email',
    redirectTo: 'login'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
