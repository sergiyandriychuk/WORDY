package resources

import (
	"github.com/stripe/stripe-go/v76"
	"time"
	"wordy-go-back/internal/domain"
)

type PaymentLinkDto struct {
	Link string `json:"link"`
}

func (d PaymentLinkDto) DomainToDto(link string) PaymentLinkDto {
	return PaymentLinkDto{
		Link: link,
	}
}

type PaymentDto struct {
	Id          uint64               `json:"id"`
	UserId      uint64               `json:"userId"`
	Price       float64              `json:"price"`
	Currency    stripe.Currency      `json:"currency"`
	Status      stripe.InvoiceStatus `json:"status"`
	InvoiceUrl  string               `json:"invoiceUrl"`
	CardData    CardDataDto          `json:"cardData"`
	CreatedDate time.Time            `json:"createdDate"`
	UpdatedDate time.Time            `json:"updatedDate"`
}

type CardDataDto struct {
	Brand    stripe.PaymentMethodCardBrand `json:"brand"`
	Last4    string                        `json:"last4"`
	ExpMonth int64                         `json:"expMonth"`
	ExpYear  int64                         `json:"expYear"`
}

func (d PaymentDto) DomainToDto(p domain.Payment) PaymentDto {
	return PaymentDto{
		Id:         p.Id,
		UserId:     p.UserId,
		Price:      float64(p.Price) / 100,
		Currency:   p.Currency,
		Status:     p.Status,
		InvoiceUrl: p.InvoiceUrl,
		CardData: CardDataDto{
			Brand:    p.CardData.Brand,
			Last4:    p.CardData.Last4,
			ExpMonth: p.CardData.ExpMonth,
			ExpYear:  p.CardData.ExpYear,
		},
		CreatedDate: p.CreatedDate,
		UpdatedDate: p.UpdatedDate,
	}
}

type PaymentsDto struct {
	Items []PaymentDto `json:"items"`
	Total uint64       `json:"total"`
	Pages uint         `json:"pages"`
}

func (d PaymentsDto) DomainToDtoPagination(ps domain.Payments) PaymentsDto {
	result := make([]PaymentDto, len(ps.Items))
	for i := range ps.Items {
		var pDto PaymentDto
		result[i] = pDto.DomainToDto(ps.Items[i])
	}
	return PaymentsDto{Items: result, Pages: ps.Pages, Total: ps.Total}
}

type SubscriptionDto struct {
	Id              uint64                     `json:"id"`
	UserId          uint64                     `json:"userId"`
	Price           float64                    `json:"price"`
	Currency        stripe.Currency            `json:"currency"`
	CardData        CardDataDto                `json:"cardData"`
	Status          *stripe.SubscriptionStatus `json:"status,omitempty"`
	Paused          *bool                      `json:"paused,omitempty"`
	NextPaymentDate time.Time                  `json:"nextPaymentDate"`
	CreatedDate     time.Time                  `json:"createdDate"`
	UpdatedDate     time.Time                  `json:"updatedDate"`
}

func (d SubscriptionDto) DomainToDto(s domain.Subscription) SubscriptionDto {
	return SubscriptionDto{
		Id:       s.Id,
		UserId:   s.UserId,
		Price:    float64(s.Price) / 100,
		Currency: s.Currency,
		Status:   s.Status,
		Paused:   s.Paused,
		CardData: CardDataDto{
			Brand:    s.CardData.Brand,
			Last4:    s.CardData.Last4,
			ExpMonth: s.CardData.ExpMonth,
			ExpYear:  s.CardData.ExpYear,
		},
		NextPaymentDate: s.NextPaymentDate,
		CreatedDate:     s.CreatedDate,
		UpdatedDate:     s.UpdatedDate,
	}
}
