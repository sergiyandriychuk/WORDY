import {Component, OnInit} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {DatePipe} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {take} from 'rxjs/operators';

import {CurrencyName, Pagination, PaginationOptions, PaymentItem, UserSubscription} from '@app/shared/models';
import {DEFAULT_PAGINATION_OPTIONS, matDialogRemove} from '@app/shared/constants';
import {DialogService, LocalizeService, RequestsService, UserService, UtilsService} from '@app/shared/services';
import {SubscriptionStatus} from '@app/shared/enums';
import {RemoveModalComponent} from '@app/shared/components';
import {CurrencySymbolPipe} from '@app/shared/pipes';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {

  public loading: boolean = true;
  public oops: boolean = false;
  public isSubscriptionStatusTrialing: boolean | null = null;
  public isSubscriptionStatusCancelled: boolean | null = null;
  public isSubscriptionStatusActive: boolean | null = null;
  public isSubscriptionStatusPastDue: boolean | null = null;
  public isSubscriptionStatusUnknown: boolean | null = null;
  public isSubscriptionActiveWithoutSubscribe: boolean | null = null;
  public isCardAttachment: boolean = false;
  public userSubscriptionIsExpires: boolean = false;

  public userSubscription: UserSubscription | null = null;
  public displayedItems: string[] = ['date', 'amount', 'card', 'status', 'invoice'];
  public paymentItems: PaymentItem[] = [];
  public hidePagination: boolean = true;
  public paginationOptions: PaginationOptions = {
    ...DEFAULT_PAGINATION_OPTIONS,
    hidePageSize: true,
    showFirstLastButtons: false
  };

  constructor(
    public dialog: MatDialog,
    public datePipe: DatePipe,
    public localizeSvc: LocalizeService,
    private dialogSvc: DialogService,
    private utilsSvc: UtilsService,
    private requestsSvc: RequestsService,
    private userSvc: UserService,
    private currencySymbolPipe: CurrencySymbolPipe
  ) {
  }

  ngOnInit() {
    this.loadUserSubscription();
  }

  public get currentCurrency() {
    const currency: CurrencyName | undefined = this.userSubscription?.currency;
    return this.currencySymbolPipe.transform(currency);
  }

  public get currentPrice() {
    return this.userSubscription?.price || 0;
  }

  public get translateParams() {
    return {
      currency: this.currentCurrency,
      price: this.currentPrice
    };
  }

  private async loadUserSubscription(subscription?: UserSubscription): Promise<void> {
    try {
      let userSub: UserSubscription;

      if (subscription) {
        userSub = subscription;
      } else {
        userSub = await this.requestsSvc.findSubscription();
      }

      this.userSubscription = userSub;

      this.userSubscriptionIsExpires = this.userSvc.isUserSubscriptionExpires(userSub);
      this.isCardAttachment = Boolean(userSub.cardData.last4);

      await this.loadPayments();

      this.isSubscriptionActiveWithoutSubscribe = [SubscriptionStatus.Active, SubscriptionStatus.Canceled].includes(userSub.status) && !this.userSubscriptionIsExpires && !this.paymentItems.length;

      switch (userSub.status) {
        case SubscriptionStatus.Trialing:
          this.isSubscriptionStatusTrialing = true;
          this.isSubscriptionStatusActive = false;
          this.isSubscriptionStatusCancelled = false;
          this.isSubscriptionStatusPastDue = false;
          this.isSubscriptionStatusUnknown = false;
          break;
        case SubscriptionStatus.Active:
          this.isSubscriptionStatusTrialing = false;
          this.isSubscriptionStatusActive = true;
          this.isSubscriptionStatusCancelled = false;
          this.isSubscriptionStatusPastDue = false;
          this.isSubscriptionStatusUnknown = false;
          break;
        case SubscriptionStatus.Canceled:
          this.isSubscriptionStatusTrialing = false;
          this.isSubscriptionStatusActive = false;
          this.isSubscriptionStatusCancelled = true;
          this.isSubscriptionStatusPastDue = false;
          this.isSubscriptionStatusUnknown = false;
          break;
        case SubscriptionStatus.PastDue:
          this.isSubscriptionStatusTrialing = false;
          this.isSubscriptionStatusActive = false;
          this.isSubscriptionStatusCancelled = false;
          this.isSubscriptionStatusPastDue = true;
          this.isSubscriptionStatusUnknown = false;
          break;
        default:
          this.isSubscriptionStatusTrialing = false;
          this.isSubscriptionStatusActive = false;
          this.isSubscriptionStatusCancelled = false;
          this.isSubscriptionStatusPastDue = false;
          this.isSubscriptionStatusUnknown = true;
          await this.localizeSvc.onLangLoad();
          throw new Error(this.localizeSvc.translate('DIALOGS.ERROR.SUBSCRIPTION_STATUS_UNKNOWN.TITLE'));
      }

      if (!userSub?.nextPaymentDate || !this.utilsSvc.dateIsValid(new Date(userSub.nextPaymentDate))) {
        await this.localizeSvc.onLangLoad();
        throw new Error(this.localizeSvc.translate('DIALOGS.ERROR.INVALID_NEXT_PAYMENT_DATE.TITLE'));
      }

      this.loading = false;
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
      this.loading = false;
    }
  }

  public async paginationChange(event: PageEvent): Promise<void> {
    this.paginationOptions.pageIndex = event.pageIndex;
    this.paginationOptions.pageSize = event.pageSize;
    this.paginationOptions.length = event.length;

    await this.loadPayments();
  }

  private async loadPayments(): Promise<void> {
    try {
      const response: Pagination<PaymentItem> = await this.requestsSvc.findPayments(this.paginationOptions.pageIndex + 1, this.paginationOptions.pageSize);

      if (!Array.isArray(response.items)) {
        throw new Error(this.localizeSvc.translate('DIALOGS.ERROR.INVALID_PAYMENT_ITEMS.TITLE'));
      }

      this.paymentItems = response.items;
      this.hidePagination = response.pages <= 1;
      this.paginationOptions.length = response.total;
    } catch (e) {
      this.paymentItems = [];
      this.hidePagination = true;
      this.paginationOptions.length = 0;
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
    }
  }

  public async subscribe(): Promise<void> {
    try {
      const {link} = await this.requestsSvc.generatePaymentLink();

      if (!link) {
        throw new Error(this.localizeSvc.translate('DIALOGS.ERROR.INVALID_SUBSCRIPTION_LINK.TITLE'));
      }

      window.open(link, '_self');
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
    }
  }

  public async attachCard(): Promise<void> {
    try {
      const {link} = await this.requestsSvc.generateAttachCardLink();

      if (!link) {
        throw new Error(this.localizeSvc.translate('DIALOGS.ERROR.INVALID_CARD_ATTACHMENT_LINK.TITLE'));
      }

      window.open(link, '_self');
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
    }
  }

  public openConfirmationModal(): void {
    this.dialog.open(RemoveModalComponent, {
      ...matDialogRemove,
      data: {
        cancelSubscription: true
      }
    }).afterClosed()
      .pipe(take(1))
      .subscribe((res: string | null) => {
        if (res === 'remove') {
          this.unsubscribe();
        }
      });
  }

  private async unsubscribe(): Promise<void> {
    try {
      const subscription: UserSubscription = await this.requestsSvc.cancelSubscription();
      await this.loadUserSubscription(subscription);
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
      await this.loadUserSubscription();
    }
  }

}
