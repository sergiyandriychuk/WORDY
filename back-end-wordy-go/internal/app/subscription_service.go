package app

import (
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/subscription"
	"log"
	"time"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/database"
)

type SubscriptionService interface {
	Find(id uint64) (domain.Subscription, error)
	FindByUid(uId uint64) (domain.Subscription, error)
	Save(sub domain.Subscription) (domain.Subscription, error)
	Update(sub domain.Subscription) (domain.Subscription, error)
	CustomerCreate(u domain.User) (string, error)
	CancelSubscription(sub domain.Subscription) (domain.Subscription, error)
	ResumeSubscription(sub domain.Subscription) (domain.Subscription, error)
	PauseSubscription(sub domain.Subscription) (domain.Subscription, error)
}

type subscriptionService struct {
	subscriptionRepo database.SubscriptionRepository
	ProductPrice     string
}

func NewSubscriptionService(sr database.SubscriptionRepository, pp string) SubscriptionService {
	return subscriptionService{
		subscriptionRepo: sr,
		ProductPrice:     pp,
	}
}

func (s subscriptionService) Find(id uint64) (domain.Subscription, error) {
	sub, err := s.subscriptionRepo.Find(id)
	if err != nil {
		log.Printf("SubscriptionService -> Find: %s", err)
		return domain.Subscription{}, err
	}

	return sub, err
}

func (s subscriptionService) FindByUid(uId uint64) (domain.Subscription, error) {
	sub, err := s.subscriptionRepo.FindByUid(uId)
	if err != nil {
		log.Printf("SubscriptionService -> Find: %s", err)
		return domain.Subscription{}, err
	}

	return sub, err
}

func (s subscriptionService) CustomerCreate(u domain.User) (string, error) {
	params := &stripe.CustomerParams{
		Email: &u.Email,
	}

	cus, err := customer.New(params)
	if err != nil {
		log.Printf("SubscriptionService -> CustomerCreate -> customer.New: %s", err)
		return "", err
	}

	return cus.ID, nil
}

func (s subscriptionService) Save(sub domain.Subscription) (domain.Subscription, error) {
	now := time.Now()
	//nextMonth := now.AddDate(0, 0, 7)
	nextMonth := now.Add(time.Minute * 5)

	params := &stripe.SubscriptionParams{
		Customer: &sub.CustomerId,
		Items:    []*stripe.SubscriptionItemsParams{{Price: &s.ProductPrice}},
		TrialEnd: stripe.Int64(nextMonth.Unix()),
	}

	stripeSub, err := subscription.New(params)
	if err != nil {
		log.Printf("SubscriptionService -> subscription.New: %s", err)
		return domain.Subscription{}, err
	}

	sub.SubscriptionId = stripeSub.ID
	sub.Status = &stripeSub.Status
	sub.NextPaymentDate = time.Unix(stripeSub.CurrentPeriodEnd, 0).UTC()
	sub.Currency = stripeSub.Currency
	sub.CustomerId = stripeSub.Customer.ID
	sub.Price = stripeSub.Items.Data[0].Price.UnitAmount

	sub, err = s.subscriptionRepo.Save(sub)
	if err != nil {
		log.Printf("SubscriptionService -> Save: %s", err)
		return domain.Subscription{}, err
	}

	return sub, err
}

func (s subscriptionService) Update(sub domain.Subscription) (domain.Subscription, error) {
	sub, err := s.subscriptionRepo.Update(sub)
	if err != nil {
		log.Printf("SubscriptionService -> Update: %s", err)
		return domain.Subscription{}, err
	}

	return sub, err
}

func (s subscriptionService) CancelSubscription(sub domain.Subscription) (domain.Subscription, error) {
	subs, err := subscription.Cancel(sub.SubscriptionId, nil)
	if err != nil {
		log.Printf("SubscriptionService -> CancelSubscription -> subscription.Cancel: %s", err)
		return domain.Subscription{}, err
	}

	sub.Status = &subs.Status
	sub, err = s.subscriptionRepo.Update(sub)
	if err != nil {
		log.Printf("SubscriptionService -> CancelSubscription -> s.subscriptionRepo.Update: %s", err)
		return domain.Subscription{}, err
	}

	return sub, err
}

func (s subscriptionService) PauseSubscription(sub domain.Subscription) (domain.Subscription, error) {
	stripeSub, err := subscription.Update(sub.SubscriptionId,
		&stripe.SubscriptionParams{
			PauseCollection: &stripe.SubscriptionPauseCollectionParams{
				Behavior: stripe.String(string(stripe.SubscriptionPauseCollectionBehaviorVoid)),
			},
		})
	if err != nil {
		log.Printf("SubscriptionService -> PauseSubscription -> subscription.Update: %s", err)
		return domain.Subscription{}, err
	}

	sub.Status = &stripeSub.Status
	paused := false
	if stripeSub.PauseCollection.Behavior == stripe.SubscriptionPauseCollectionBehaviorVoid {
		paused = true
	}
	sub.Paused = &paused
	sub, err = s.subscriptionRepo.Update(sub)
	if err != nil {
		log.Printf("SubscriptionService -> PauseSubscription -> s.subscriptionRepo.Update: %s", err)
		return domain.Subscription{}, err
	}

	return sub, err
}

func (s subscriptionService) ResumeSubscription(sub domain.Subscription) (domain.Subscription, error) {
	resumesAt := time.Now().Unix()
	stripeSub, err := subscription.Update(sub.SubscriptionId,
		&stripe.SubscriptionParams{
			PauseCollection: &stripe.SubscriptionPauseCollectionParams{
				Behavior:  stripe.String(string(stripe.SubscriptionPauseCollectionBehaviorKeepAsDraft)),
				ResumesAt: &resumesAt,
			},
		})
	if err != nil {
		log.Printf("SubscriptionService -> ResumeSubscription -> subscription.Update: %s", err)
		return domain.Subscription{}, err
	}

	sub.Status = &stripeSub.Status
	if stripeSub.PauseCollection == nil {
		sub.Paused = nil
	}
	sub, err = s.subscriptionRepo.Update(sub)
	if err != nil {
		log.Printf("SubscriptionService -> ResumeSubscription -> s.subscriptionRepo.Update: %s", err)
		return domain.Subscription{}, err
	}

	return sub, err
}
