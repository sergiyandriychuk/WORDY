import {Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';

import {ApiService} from '@app/shared/services/api.service';
import {
  GenerateAttachCardLinkResponse,
  GeneratePaymentLinkResponse,
  Pagination,
  PaymentItem,
  UrlsLibraryItem,
  UserSubscription
} from '@app/shared/models';

@Injectable()
export class RequestsService {

  constructor(
    private apiSvc: ApiService
  ) {
  }

  public async generatePaymentLink(): Promise<GeneratePaymentLinkResponse> {
    return firstValueFrom(this.apiSvc.post('/payments'));
  }

  public async generateAttachCardLink(): Promise<GenerateAttachCardLinkResponse> {
    return firstValueFrom(this.apiSvc.post('/payments/cards'));
  }

  public async findSubscription(): Promise<UserSubscription> {
    return firstValueFrom(this.apiSvc.get('/payments/subscription'));
  }

  public async findPayments(page: number, count: number): Promise<Pagination<PaymentItem>> {
    return firstValueFrom(this.apiSvc.get(`/payments?page=${page}&count=${count}`));
  }

  public async cancelSubscription(): Promise<UserSubscription> {
    return firstValueFrom(this.apiSvc.delete('/payments/subscription'));
  }

  public async toggleUrlsLibraryItem(urlsLibraryItemId: number, enabled: boolean): Promise<UrlsLibraryItem> {
    return firstValueFrom(this.apiSvc.put(`/urls/toggle/${urlsLibraryItemId}`, {enabled}));
  }

}
