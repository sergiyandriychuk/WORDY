package controllers

import (
	"encoding/json"
	"errors"
	"github.com/stripe/stripe-go/v76"
	"github.com/upper/db/v4"
	"log"
	"net/http"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/http/requests"
	"wordy-go-back/internal/infra/http/resources"
)

type PaymentController struct {
	paymentService      app.PaymentService
	subscriptionService app.SubscriptionService
}

func NewPaymentController(ps app.PaymentService, ss app.SubscriptionService) PaymentController {
	return PaymentController{
		paymentService:      ps,
		subscriptionService: ss,
	}
}

func (c PaymentController) GenerateCheckoutLink() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := r.Context().Value(UserKey).(domain.User)
		link, err := c.paymentService.GenerateCheckoutLink(user)
		if err != nil {
			log.Printf("PaymentController -> GenerateCheckoutLink: %s", err)
			BadRequest(w, err)
			return
		}

		var lDto resources.PaymentLinkDto
		Success(w, lDto.DomainToDto(link))
	}
}

func (c PaymentController) GenerateCardAttachLink() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := r.Context().Value(UserKey).(domain.User)
		link, err := c.paymentService.GenerateCardAttachLink(user)
		if err != nil {
			log.Printf("PaymentController -> GenerateCheckoutLink: %s", err)
			BadRequest(w, err)
			return
		}

		var lDto resources.PaymentLinkDto
		Success(w, lDto.DomainToDto(link))
	}
}

func (c PaymentController) DetachCard() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := r.Context().Value(UserKey).(domain.User)
		sub, err := c.paymentService.DetachCard(user)
		if err != nil {
			log.Printf("PaymentController -> DetachCard: %s", err)
			BadRequest(w, err)
			return
		}

		var sDto resources.SubscriptionDto
		Success(w, sDto.DomainToDto(sub))
	}
}

func (c PaymentController) FindSubscription() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := r.Context().Value(UserKey).(domain.User)
		s, err := c.subscriptionService.FindByUid(u.Id)
		if err != nil && !errors.Is(err, db.ErrNoMoreRows) {
			log.Printf("PaymentController -> FindSubscription: %s", err)
			BadRequest(w, err)
			return
		}

		var sDto resources.SubscriptionDto
		Success(w, sDto.DomainToDto(s))
	}
}

func (c PaymentController) CancelSubscription() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := r.Context().Value(UserKey).(domain.User)
		s, err := c.subscriptionService.FindByUid(u.Id)
		if err != nil {
			log.Printf("PaymentController -> FindSubscription -> c.subscriptionService.FindByUid: %s", err)
			BadRequest(w, err)
			return
		}

		s, err = c.subscriptionService.CancelSubscription(s)
		if err != nil {
			log.Printf("PaymentController -> CancelSubscription -> c.subscriptionService.CancelSubscription: %s", err)
			BadRequest(w, err)
			return
		}

		var sDto resources.SubscriptionDto
		Success(w, sDto.DomainToDto(s))
	}
}

func (c PaymentController) PauseSubscription() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := r.Context().Value(UserKey).(domain.User)
		s, err := c.subscriptionService.FindByUid(u.Id)
		if err != nil {
			log.Printf("PaymentController -> PauseSubscription -> c.subscriptionService.FindByUid: %s", err)
			BadRequest(w, err)
			return
		}

		s, err = c.subscriptionService.PauseSubscription(s)
		if err != nil {
			log.Printf("PaymentController -> PauseSubscription -> c.subscriptionService.CancelSubscription: %s", err)
			BadRequest(w, err)
			return
		}

		var sDto resources.SubscriptionDto
		Success(w, sDto.DomainToDto(s))
	}
}

func (c PaymentController) ResumeSubscription() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := r.Context().Value(UserKey).(domain.User)
		s, err := c.subscriptionService.FindByUid(u.Id)
		if err != nil {
			log.Printf("PaymentController -> ResumeSubscription -> c.subscriptionService.FindByUid: %s", err)
			BadRequest(w, err)
			return
		}

		s, err = c.subscriptionService.ResumeSubscription(s)
		if err != nil {
			log.Printf("PaymentController -> ResumeSubscription -> c.subscriptionService.CancelSubscription: %s", err)
			BadRequest(w, err)
			return
		}

		var sDto resources.SubscriptionDto
		Success(w, sDto.DomainToDto(s))
	}
}

func (c PaymentController) FindPayments() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := r.Context().Value(UserKey).(domain.User)
		pagination, err := requests.DecodePaginationQuery(r)
		if err != nil {
			log.Printf("PaymentController -> FindPayments -> requests.DecodePaginationQuery: %s", err)
			BadRequest(w, err)
			return
		}

		var ps domain.Payments
		ps, err = c.paymentService.FindList(pagination, u.Id)
		if err != nil {
			log.Printf("PaymentController -> FindPayments -> c.paymentService.FindList: %s", err)
			BadRequest(w, err)
			return
		}

		var pDto resources.PaymentsDto
		Success(w, pDto.DomainToDtoPagination(ps))
	}
}

func (c PaymentController) Webhook() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		event := &stripe.Event{}
		if err := json.NewDecoder(r.Body).Decode(event); err != nil {
			log.Printf("PaymentController: %s", err)
			return
		}

		switch event.Type {

		case stripe.EventTypePaymentMethodAttached:
			var pm stripe.PaymentMethod
			err := json.Unmarshal(event.Data.Raw, &pm)
			if err != nil {
				log.Printf("PaymentController -> json.Unmarshal: %s", err)
				InternalServerError(w, err)
				return
			}

			err = c.paymentService.HandlePaymentMethodAttached(pm)
			if err != nil {
				log.Printf("PaymentController -> c.paymentService.HandlePaymentMethodAttached: %s", err)
				InternalServerError(w, err)
				return
			}

		case
			stripe.EventTypeCustomerSubscriptionCreated,
			stripe.EventTypeCustomerSubscriptionUpdated,
			stripe.EventTypeCustomerSubscriptionDeleted:
			var sub stripe.Subscription
			err := json.Unmarshal(event.Data.Raw, &sub)
			if err != nil {
				log.Printf("PaymentController -> json.Unmarshal: %s", err)
				InternalServerError(w, err)
				return
			}

			err = c.paymentService.HandleCustomerSubscriptionEvent(sub)
			if err != nil {
				log.Printf("PaymentController -> c.paymentService.HandleCustomerSubscriptionEvent: %s", err)
				InternalServerError(w, err)
				return
			}

		case stripe.EventTypeInvoicePaymentSucceeded:
			var inv stripe.Invoice
			err := json.Unmarshal(event.Data.Raw, &inv)
			if err != nil {
				log.Printf("PaymentController -> json.Unmarshal: %s", err)
				InternalServerError(w, err)
				return
			}

			err = c.paymentService.HandleInvoicePaymentSucceededEvent(inv)
			if err != nil {
				log.Printf("PaymentController -> c.paymentService.HandleInvoicePaymentSucceededEvent: %s", err)
				InternalServerError(w, err)
				return
			}
		case stripe.EventTypeInvoicePaymentFailed:
			var inv stripe.Invoice
			err := json.Unmarshal(event.Data.Raw, &inv)
			if err != nil {
				log.Printf("PaymentController -> json.Unmarshal: %s", err)
				InternalServerError(w, err)
				return
			}

			err = c.paymentService.HandleInvoicePaymentFailedEvent(inv)
			if err != nil {
				log.Printf("PaymentController -> c.paymentService.EventTypeInvoicePaymentFailed: %s", err)
				InternalServerError(w, err)
				return
			}

		default:
		}

		Ok(w)
	}
}
