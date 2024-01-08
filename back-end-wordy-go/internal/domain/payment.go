package domain

import (
	"github.com/stripe/stripe-go/v76"
	"time"
)

type Payment struct {
	Id              uint64
	UserId          uint64
	CustomerId      string
	SubscriptionId  string
	InvoiceId       string
	PaymentIntentId string
	Price           int64
	Currency        stripe.Currency
	Status          stripe.InvoiceStatus
	InvoiceUrl      string
	CardData        CardData
	CreatedDate     time.Time
	UpdatedDate     time.Time
}

type Payments struct {
	Items []Payment
	Total uint64
	Pages uint
}
