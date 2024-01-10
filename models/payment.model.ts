import {SubscriptionStatus} from '@app/shared/enums';

export interface UserSubscription {
  id: number;
  userId: number;
  price: number;
  currency: CurrencyName;
  cardData: CardData;
  status: SubscriptionStatus;
  nextPaymentDate: string;
  createdDate: string;
  updatedDate: string;
}

export interface CardData {
  brand: CardType;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface PaymentItem {
  id: number;
  userId: number;
  price: number;
  currency: CurrencyName;
  status: PaymentStatus;
  invoiceUrl: string;
  cardData: CardData;
  createdDate: string;
  updatedDate: string;
}

export type CardType = 'visa' | 'mastercard'

export type CurrencyName = 'eur'

export type PaymentStatus = 'paid' | 'open' | 'failed'
