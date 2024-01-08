package domain

import (
	"github.com/stripe/stripe-go/v76"
	"time"
)

type Subscription struct {
	Id              uint64
	UserId          uint64
	CustomerId      string
	SubscriptionId  string
	Price           int64
	Currency        stripe.Currency
	CardData        CardData
	Status          *stripe.SubscriptionStatus
	Paused          *bool
	NextPaymentDate time.Time
	CreatedDate     time.Time
	UpdatedDate     time.Time
	DeletedDate     *time.Time
}

type CardData struct {
	Brand           stripe.PaymentMethodCardBrand `json:"brand"`
	Last4           string                        `json:"last4"`
	ExpMonth        int64                         `json:"expMonth"`
	ExpYear         int64                         `json:"expYear"`
	PaymentMethodId string                        `json:"paymentMethodId"`
}

func (s Subscription) GetUserId() uint64 {
	return s.UserId
}
