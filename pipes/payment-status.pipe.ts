import {Pipe, PipeTransform} from '@angular/core';

import {PaymentStatus} from '@app/shared/models';
import {LocalizeService} from '@app/shared/services';

@Pipe({
  name: 'paymentStatus',
  pure: false
})
export class PaymentStatusPipe implements PipeTransform {

  constructor(
    private localizeSvc: LocalizeService
  ) {
  }

  public transform(value?: PaymentStatus): string | undefined {
    switch (value) {
      case 'paid':
        return this.localizeSvc.translate('PAYMENT_STATUS.PAID');
      case 'open':
        return this.localizeSvc.translate('PAYMENT_STATUS.OPEN');
      case 'failed':
        return this.localizeSvc.translate('PAYMENT_STATUS.FAILED');
      default:
        return value || 'unknown';
    }
  }

}
