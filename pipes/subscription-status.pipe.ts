import {Pipe, PipeTransform} from '@angular/core';

import {SubscriptionStatus} from '@app/shared/enums';
import {LocalizeService} from '@app/shared/services';

@Pipe({
  name: 'subscriptionStatus',
  pure: false
})
export class SubscriptionStatusPipe implements PipeTransform {

  constructor(
    private localizeSvc: LocalizeService
  ) {
  }

  public transform(value?: SubscriptionStatus): string | undefined {
    switch (value) {
      case SubscriptionStatus.Trialing:
        return this.localizeSvc.translate('SUBSCRIPTION_STATUS.TRIALING');
      case SubscriptionStatus.Active:
        return this.localizeSvc.translate('SUBSCRIPTION_STATUS.ACTIVE');
      case SubscriptionStatus.Canceled:
        return this.localizeSvc.translate('SUBSCRIPTION_STATUS.CANCELED');
      case SubscriptionStatus.PastDue:
        return this.localizeSvc.translate('SUBSCRIPTION_STATUS.PAST_DUE');
      default:
        return value || 'unknown';
    }
  }

}
