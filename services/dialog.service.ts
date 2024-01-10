import {Injectable} from '@angular/core';
import {IndividualConfig, ToastrService} from 'ngx-toastr';

import {defaultToastConfig} from '@app/shared/constants';

@Injectable()
export class DialogService {

  constructor(
    private toastr: ToastrService
  ) {
  }

  public warningDialog(
    title: string, message?: string | null, type: 'error' | 'warning' = 'error', timeout?: number
  ): void {
    if (!(type === 'error' || type === 'warning')) return;

    const config: Partial<IndividualConfig> = {
      ...defaultToastConfig
    };

    if (timeout) {
      config.timeOut = timeout;
    }

    if (!message) {
      this.toastr[type](title, '', config);
      return;
    }

    this.toastr[type](message, title, config);
  }

}
