package app

import (
	"errors"
	"fmt"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/invoice"
	"github.com/stripe/stripe-go/v76/paymentintent"
	"github.com/stripe/stripe-go/v76/paymentmethod"
	"github.com/stripe/stripe-go/v76/subscription"
	"github.com/upper/db/v4"
	"log"
	"strconv"
	"time"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/database"
)

type PaymentService interface {
	GenerateCheckoutLink(u domain.User) (string, error)
	GenerateCardAttachLink(u domain.User) (string, error)
	DetachCard(u domain.User) (domain.Subscription, error)
	Find(id uint64) (domain.Payment, error)
	FindList(p domain.Pagination, uId uint64) (domain.Payments, error)
	Update(p domain.Payment) (domain.Payment, error)
	HandlePaymentMethodAttached(pm stripe.PaymentMethod) error
	HandleCustomerSubscriptionEvent(sub stripe.Subscription) error
	HandleInvoicePaymentSucceededEvent(inv stripe.Invoice) error
	HandleInvoicePaymentFailedEvent(inv stripe.Invoice) error
}

type paymentService struct {
	subscriptionRepo  database.SubscriptionRepository
	paymentRepo       database.PaymentRepository
	userRepo          database.UserRepository
	PaymentSuccessUrl string
	PaymentCancelUrl  string
	BillingUrl        string
	ProductPrice      string
}

func NewPaymentService(
	sr database.SubscriptionRepository,
	pr database.PaymentRepository,
	ur database.UserRepository,
	su, cu, bu, pp string) PaymentService {
	return paymentService{
		subscriptionRepo:  sr,
		paymentRepo:       pr,
		userRepo:          ur,
		PaymentSuccessUrl: su,
		PaymentCancelUrl:  cu,
		BillingUrl:        bu,
		ProductPrice:      pp,
	}
}

func (s paymentService) GenerateCardAttachLink(u domain.User) (string, error) {
	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: []*string{
			stripe.String("card"),
		},
		SuccessURL: &s.BillingUrl,
		CancelURL:  &s.PaymentCancelUrl,
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSetup)),
		Customer:   u.CustomerId,
	}

	sess, err := session.New(params)
	if err != nil {
		log.Printf("PaymentService -> GenerateCardAttachLink -> session.New: %s", err)
		return "", err
	}

	return sess.URL, nil
}

func (s paymentService) DetachCard(u domain.User) (domain.Subscription, error) {
	sub, err := s.subscriptionRepo.FindByCustomerId(*u.CustomerId)
	if err != nil {
		log.Printf("PaymentService -> DetachCard -> s.subscriptionRepo.FindByCustomerId: %s", err)
		return domain.Subscription{}, err
	}

	_, err = paymentmethod.Detach(
		sub.CardData.PaymentMethodId,
		nil,
	)
	if err != nil {
		log.Printf("PaymentService -> DetachCard -> paymentmethod.Detach: %s", err)
		return domain.Subscription{}, err
	}

	sub.CardData.Last4 = ""
	sub.CardData.PaymentMethodId = ""
	sub.CardData.Brand = ""
	sub.CardData.ExpYear = 0
	sub.CardData.ExpMonth = 0

	sub, err = s.subscriptionRepo.Update(sub)
	if err != nil {
		log.Printf("PaymentService -> DetachCard -> .subscriptionRepo.Update: %s", err)
		return domain.Subscription{}, err
	}

	return sub, nil
}

func (s paymentService) GenerateCheckoutLink(u domain.User) (string, error) {
	sub, err := s.subscriptionRepo.FindByUid(u.Id)
	if err != nil {
		log.Printf("PaymentService -> GenerateCheckoutLink -> s.subscriptionRepo.FindByUid: %s", err)
		return "", err
	}

	if *sub.Status == stripe.SubscriptionStatusActive {
		err = fmt.Errorf("your subscription %s is active", sub.SubscriptionId)
		return "", err
	}

	var trialEnd int64
	var additionalTime time.Duration
	if *sub.Status == stripe.SubscriptionStatusTrialing ||
		*sub.Status == stripe.SubscriptionStatusCanceled {
		if sub.NextPaymentDate.After(time.Now()) {
			trialEnd = sub.NextPaymentDate.Add(additionalTime).Unix()
		}
	}

	paymentTypeCard := "card"
	pmt := []*string{
		&paymentTypeCard,
	}
	paymentMode := "subscription"
	uId := strconv.FormatUint(u.Id, 10)

	var subscriptionData stripe.CheckoutSessionSubscriptionDataParams
	if trialEnd > 0 && additionalTime.Seconds() > (time.Hour*48).Seconds() {
		subscriptionData.TrialEnd = &trialEnd
	}

	params := &stripe.CheckoutSessionParams{
		SuccessURL:         &s.PaymentSuccessUrl,
		CancelURL:          &s.PaymentCancelUrl,
		PaymentMethodTypes: pmt,
		Mode:               &paymentMode,
		LineItems:          []*stripe.CheckoutSessionLineItemParams{},
		ClientReferenceID:  &uId,
		Customer:           u.CustomerId,
		SubscriptionData:   &subscriptionData,
	}

	params.LineItems = append(params.LineItems, &stripe.CheckoutSessionLineItemParams{
		Price:    stripe.String(s.ProductPrice),
		Quantity: stripe.Int64(1),
	})

	sess, err := session.New(params)
	if err != nil {
		log.Printf("PaymentService -> GenerateCheckoutLink -> session.New: %s", err)
		return "", err
	}

	return sess.URL, err
}

func (s paymentService) Find(id uint64) (domain.Payment, error) {
	p, err := s.paymentRepo.Find(id)
	if err != nil {
		log.Printf("PaymentService -> Find: %s", err)
		return domain.Payment{}, err
	}

	return p, err
}

func (s paymentService) FindList(p domain.Pagination, uId uint64) (domain.Payments, error) {
	ps, err := s.paymentRepo.FindList(p, uId)
	if err != nil {
		log.Printf("PaymentService -> FindList: %s", err)
		return domain.Payments{}, err
	}

	return ps, err
}

func (s paymentService) Update(p domain.Payment) (domain.Payment, error) {
	p, err := s.paymentRepo.Update(p)
	if err != nil {
		log.Printf("PaymentService -> Update: %s", err)
		return domain.Payment{}, err
	}

	return p, err
}

func (s paymentService) HandlePaymentMethodAttached(pm stripe.PaymentMethod) error {
	subs, err := s.subscriptionRepo.FindByCustomerId(pm.Customer.ID)
	if err != nil && !errors.Is(err, db.ErrNoMoreRows) {
		log.Printf("PaymentService -> HandlePaymentMethodAttached -> s.subscriptionRepo.FindBySessId: %s", err)
		return err
	}

	var stripePm *stripe.PaymentMethod
	stripePm, err = paymentmethod.Get(pm.ID, nil)
	if err != nil {
		log.Printf("PaymentService -> HandleCustomerSubscriptionEvent -> paymentmethod.Get: %s", err)
		return err
	}

	if subs.Id != 0 {
		params := &stripe.SubscriptionListParams{
			Customer: &subs.CustomerId,
		}
		i := subscription.List(params)
		var (
			strSubs []stripe.Subscription
		)
		for i.Next() {
			strSub := i.Subscription()
			strSubs = append(strSubs, *strSub)
		}

		var strSub stripe.Subscription
		for _, sub := range strSubs {
			if sub.Created > strSub.Created {
				strSub = sub
			}
		}

		var subscriptionId = subs.SubscriptionId
		if strSub.ID != "" {
			subscriptionId = strSub.ID
		}

		var stripeSub *stripe.Subscription
		stripeSub, err = subscription.Get(subscriptionId, nil)
		if err != nil {
			log.Printf("PaymentService -> HandlePaymentMethodAttached -> subscription.Get: %s", err)
			return err
		}

		if stripeSub.Status != stripe.SubscriptionStatusCanceled &&
			stripeSub.Status != stripe.SubscriptionStatusIncompleteExpired {
			_, err = subscription.Update(
				subscriptionId,
				&stripe.SubscriptionParams{
					DefaultPaymentMethod: stripe.String(stripePm.ID),
				})
			if err != nil {
				log.Printf("PaymentService -> HandlePaymentMethodAttached -> subscription.Update: %s", err)
				return err
			}
		}

		pmParams := &stripe.PaymentMethodListParams{
			Customer: stripe.String(stripePm.Customer.ID),
			Type:     stripe.String("card"),
		}
		j := paymentmethod.List(pmParams)
		for j.Next() {
			strPm := j.PaymentMethod()
			if strPm.ID != stripePm.ID {
				_, err = paymentmethod.Detach(strPm.ID, nil)
				if err != nil {
					log.Printf("PaymentService -> HandlePaymentMethodAttached -> paymentmethod.Detach: %s", err)
					return err
				}
			}
		}

		subs.CardData.ExpYear = stripePm.Card.ExpYear
		subs.CardData.ExpMonth = stripePm.Card.ExpMonth
		subs.CardData.Last4 = stripePm.Card.Last4
		subs.CardData.PaymentMethodId = stripePm.ID
		subs.CardData.Brand = stripePm.Card.Brand
		subs.SubscriptionId = stripeSub.ID
		subs.Price = stripeSub.Items.Data[0].Price.UnitAmount
		subs.Currency = stripeSub.Currency
		subs.Status = &stripeSub.Status
		subs.NextPaymentDate = time.Unix(stripeSub.CurrentPeriodEnd, 0).UTC()
		_, err = s.subscriptionRepo.Update(subs)
		if err != nil {
			log.Printf("PaymentService -> HandlePaymentMethodAttached -> s.subscriptionRepo.Update: %s", err)
			return err
		}
	}

	return nil
}

func (s paymentService) HandleCustomerSubscriptionEvent(sub stripe.Subscription) error {
	subs, err := s.subscriptionRepo.FindByCustomerId(sub.Customer.ID)
	if err != nil && !errors.Is(err, db.ErrNoMoreRows) {
		log.Printf("PaymentService -> HandleCustomerSubscriptionEvent -> s.subscriptionRepo.FindByCustomerId: %s", err)
		return err
	}

	stripeSub, err := subscription.Get(sub.ID, nil)
	if err != nil {
		log.Printf("PaymentService -> HandleCustomerSubscriptionEvent -> sub.Get: %s", err)
		return err
	}

	if subs.Id != 0 {
		if subs.SubscriptionId != stripeSub.ID {
			switch stripeSub.Status {
			case stripe.SubscriptionStatusActive:
				if *subs.Status != stripe.SubscriptionStatusCanceled &&
					*subs.Status != stripe.SubscriptionStatusIncompleteExpired {
					_, err = subscription.Cancel(subs.SubscriptionId, nil)
					if err != nil {
						log.Printf("PaymentService -> HandleCustomerSubscriptionEvent -> subscription.Cancel: %s", err)
						return err
					}
				} else {
					subs.SubscriptionId = stripeSub.ID
					subs.Price = stripeSub.Items.Data[0].Price.UnitAmount
					subs.Currency = stripeSub.Currency
					subs.Status = &stripeSub.Status
					subs.NextPaymentDate = time.Unix(stripeSub.CurrentPeriodEnd, 0).UTC()

					pmParams := &stripe.PaymentMethodListParams{
						Customer: stripe.String(stripeSub.Customer.ID),
						Type:     stripe.String("card"),
					}
					j := paymentmethod.List(pmParams)
					var lastPm stripe.PaymentMethod
					for j.Next() {
						strPm := j.PaymentMethod()
						if strPm.Created > lastPm.Created {
							lastPm = *strPm
						}
					}

					if lastPm.ID != "" {
						subs.CardData.ExpYear = lastPm.Card.ExpYear
						subs.CardData.ExpMonth = lastPm.Card.ExpMonth
						subs.CardData.Last4 = lastPm.Card.Last4
						subs.CardData.PaymentMethodId = lastPm.ID
						subs.CardData.Brand = lastPm.Card.Brand
					}

					_, err = s.subscriptionRepo.Update(subs)
					if err != nil {
						log.Printf("PaymentService -> HandleInvoicePaymentSucceededEvent -> s.subscriptionRepo.Update: %s", err)
						return err
					}
				}
			case stripe.SubscriptionStatusTrialing:
				params := &stripe.SubscriptionListParams{
					Customer: &subs.CustomerId,
				}
				params.Filters.AddFilter("status", "", string(stripe.SubscriptionStatusTrialing))
				i := subscription.List(params)
				var (
					strSubs []stripe.Subscription
				)
				for i.Next() {
					strSub := i.Subscription()
					strSubs = append(strSubs, *strSub)
				}

				var lastCreatedSub stripe.Subscription
				if len(strSubs) > 1 {
					for _, strSub := range strSubs {
						if strSub.Created > lastCreatedSub.Created {
							lastCreatedSub = strSub
						}
					}

					for _, strSub := range strSubs {
						if strSub.ID != lastCreatedSub.ID {
							_, err = subscription.Cancel(strSub.ID, nil)
							if err != nil {
								log.Printf("PaymentService -> HandleCustomerSubscriptionEvent -> subscription.Cancel: %s", err)
								return err
							}
						}
					}
				} else {
					lastCreatedSub = strSubs[0]
				}

				subs.SubscriptionId = lastCreatedSub.ID
				subs.Price = lastCreatedSub.Items.Data[0].Price.UnitAmount
				subs.Currency = lastCreatedSub.Currency
				subs.Status = &lastCreatedSub.Status
				subs.NextPaymentDate = time.Unix(lastCreatedSub.CurrentPeriodEnd, 0).UTC()

				pmParams := &stripe.PaymentMethodListParams{
					Customer: stripe.String(lastCreatedSub.Customer.ID),
					Type:     stripe.String("card"),
				}
				j := paymentmethod.List(pmParams)
				var lastPm stripe.PaymentMethod
				for j.Next() {
					strPm := j.PaymentMethod()
					if strPm.Created > lastPm.Created {
						lastPm = *strPm
					}
				}

				if lastPm.ID != "" {
					subs.CardData.ExpYear = lastPm.Card.ExpYear
					subs.CardData.ExpMonth = lastPm.Card.ExpMonth
					subs.CardData.Last4 = lastPm.Card.Last4
					subs.CardData.PaymentMethodId = lastPm.ID
					subs.CardData.Brand = lastPm.Card.Brand
				}

				_, err = s.subscriptionRepo.Update(subs)
				if err != nil {
					log.Printf("PaymentService -> HandleInvoicePaymentSucceededEvent -> s.subscriptionRepo.Update: %s", err)
					return err
				}
			default:
			}
		} else {
			subs.SubscriptionId = stripeSub.ID
			subs.Price = stripeSub.Items.Data[0].Price.UnitAmount
			subs.Currency = stripeSub.Currency
			subs.Status = &stripeSub.Status
			subs.NextPaymentDate = time.Unix(stripeSub.CurrentPeriodEnd, 0).UTC()
			if stripeSub.PauseCollection == nil {
				subs.Paused = nil
			}

			pmParams := &stripe.PaymentMethodListParams{
				Customer: stripe.String(stripeSub.Customer.ID),
				Type:     stripe.String("card"),
			}
			j := paymentmethod.List(pmParams)
			var lastPm stripe.PaymentMethod
			for j.Next() {
				strPm := j.PaymentMethod()
				if strPm.Created > lastPm.Created {
					lastPm = *strPm
				}
			}

			if lastPm.ID != "" {
				subs.CardData.ExpYear = lastPm.Card.ExpYear
				subs.CardData.ExpMonth = lastPm.Card.ExpMonth
				subs.CardData.Last4 = lastPm.Card.Last4
				subs.CardData.PaymentMethodId = lastPm.ID
				subs.CardData.Brand = lastPm.Card.Brand
			}

			_, err = s.subscriptionRepo.Update(subs)
			if err != nil {
				log.Printf("PaymentService -> HandleInvoicePaymentSucceededEvent -> s.subscriptionRepo.Update: %s", err)
				return err
			}
		}
	}

	return nil
}

func (s paymentService) HandleInvoicePaymentSucceededEvent(inv stripe.Invoice) error {
	stripeInv, err := invoice.Get(inv.ID, nil)
	if err != nil {
		log.Printf("PaymentService -> HandleInvoicePaymentSucceededEvent -> invoice.Get: %s", err)
		return err
	}

	if stripeInv.AmountDue != 0 {
		var u domain.User
		u, err = s.userRepo.FindByCustomerId(inv.Customer.ID)
		if err != nil {
			log.Printf("PaymentService -> HandleInvoicePaymentSucceededEvent -> s.userRepo.FindByCustomerId: %s", err)
			return err
		}

		cd := domain.CardData{}
		paymentIntentId := ""
		if inv.PaymentIntent != nil {
			paymentIntentId = inv.PaymentIntent.ID
			var payment *stripe.PaymentIntent
			payment, err = paymentintent.Get(inv.PaymentIntent.ID, nil)
			if err != nil {
				log.Printf("PaymentService -> HandleInvoicePaymentSucceededEvent -> paymentintent.Get: %s", err)
				return err
			}

			if payment.PaymentMethod != nil {
				var pm *stripe.PaymentMethod
				pm, err = paymentmethod.Get(payment.PaymentMethod.ID, nil)
				if err != nil {
					log.Printf("PaymentService -> HandleInvoicePaymentSucceededEvent -> paymentmethod.Get: %s", err)
					return err
				}

				cd = domain.CardData{
					PaymentMethodId: pm.ID,
					Brand:           pm.Card.Brand,
					ExpMonth:        pm.Card.ExpMonth,
					ExpYear:         pm.Card.ExpYear,
					Last4:           pm.Card.Last4}
			}
		}

		p := domain.Payment{
			UserId:          u.Id,
			CustomerId:      *u.CustomerId,
			SubscriptionId:  stripeInv.Subscription.ID,
			InvoiceId:       stripeInv.ID,
			PaymentIntentId: paymentIntentId,
			Price:           stripeInv.AmountPaid,
			Currency:        stripeInv.Currency,
			Status:          stripeInv.Status,
			InvoiceUrl:      stripeInv.HostedInvoiceURL,
			CardData:        cd,
		}

		_, err = s.paymentRepo.Save(p)
		if err != nil {
			log.Printf("PaymentService -> HandleInvoicePaymentSucceededEvent -> s.paymentRepo.Save: %s", err)
			return err
		}
	}

	return nil
}

func (s paymentService) HandleInvoicePaymentFailedEvent(inv stripe.Invoice) error {
	stripeInv, err := invoice.Get(inv.ID, nil)
	if err != nil {
		log.Printf("PaymentService -> HandleInvoicePaymentFailedEvent -> invoice.Get: %s", err)
		return err
	}

	if stripeInv.Status != stripe.InvoiceStatusPaid {
		var stripeSub *stripe.Subscription
		stripeSub, err = subscription.Get(stripeInv.Subscription.ID, nil)
		if err != nil {
			log.Printf("PaymentService -> HandleCustomerSubscriptionEvent -> sub.Get: %s", err)
			return err
		}

		if stripeSub.Status != stripe.SubscriptionStatusCanceled &&
			stripeSub.Status != stripe.SubscriptionStatusIncompleteExpired {
			stripeSub, err = subscription.Cancel(stripeInv.Subscription.ID, nil)
			if err != nil {
				log.Printf("PaymentService -> HandleInvoicePaymentFailedEvent -> subscription.Cancel: %s", err)
				return err
			}
		}

		var subs domain.Subscription
		subs, err = s.subscriptionRepo.FindByCustomerId(stripeInv.Customer.ID)
		if err != nil {
			log.Printf("PaymentService -> HandleInvoicePaymentFailedEvent -> s.subscriptionRepo.FindBySid: %s", err)
			return err
		}

		subs.SubscriptionId = stripeSub.ID
		subs.Price = stripeSub.Items.Data[0].Price.UnitAmount
		subs.Currency = stripeSub.Currency
		subs.Status = &stripeSub.Status
		subs.NextPaymentDate = time.Unix(stripeSub.CurrentPeriodEnd, 0).UTC()
		_, err = s.subscriptionRepo.Update(subs)
		if err != nil {
			log.Printf("PaymentService -> HandleInvoicePaymentFailedEvent -> s.subscriptionRepo.Update: %s", err)
			return err
		}
	} else {
		err = s.HandleInvoicePaymentSucceededEvent(inv)
		if err != nil {
			log.Printf("PaymentService -> HandleInvoicePaymentFailedEvent -> s.HandleInvoicePaymentSucceededEvent: %s", err)
			return err
		}
	}

	return nil
}
