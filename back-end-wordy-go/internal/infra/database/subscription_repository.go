package database

import (
	"encoding/json"
	"github.com/stripe/stripe-go/v76"
	"github.com/upper/db/v4"
	"time"
	"wordy-go-back/internal/domain"
)

const SubscriptionsTableName = "subscriptions"

type subscription struct {
	Id              uint64                     `db:"id,omitempty"`
	UserId          uint64                     `db:"user_id"`
	CustomerId      string                     `db:"customer_id"`
	SubscriptionId  string                     `db:"subscription_id"`
	Price           int64                      `db:"price"`
	Currency        stripe.Currency            `db:"currency"`
	CardData        []byte                     `db:"card_data"`
	Status          *stripe.SubscriptionStatus `db:"status"`
	Paused          *bool                      `db:"paused"`
	NextPaymentDate time.Time                  `db:"next_payment_date"`
	CreatedDate     time.Time                  `db:"created_date"`
	UpdatedDate     time.Time                  `db:"updated_date"`
	DeletedDate     *time.Time                 `db:"deleted_date"`
}

type SubscriptionRepository interface {
	Find(id uint64) (domain.Subscription, error)
	FindByCustomerId(cId string) (domain.Subscription, error)
	FindByUid(uId uint64) (domain.Subscription, error)
	FindBySid(sId string) (domain.Subscription, error)
	Save(s domain.Subscription) (domain.Subscription, error)
	Update(s domain.Subscription) (domain.Subscription, error)
}

type subscriptionRepository struct {
	coll db.Collection
	sess db.Session
}

func NewSubscriptionRepository(dbSession db.Session) SubscriptionRepository {
	return subscriptionRepository{
		coll: dbSession.Collection(SubscriptionsTableName),
		sess: dbSession,
	}
}

func (r subscriptionRepository) Find(id uint64) (domain.Subscription, error) {
	var s subscription
	err := r.coll.Find(db.Cond{"id": id}).One(&s)
	if err != nil {
		return domain.Subscription{}, err
	}

	return r.mapModelToDomain(s)
}

func (r subscriptionRepository) FindByCustomerId(cId string) (domain.Subscription, error) {
	var s subscription
	err := r.coll.Find(db.Cond{"customer_id": cId}).One(&s)
	if err != nil {
		return domain.Subscription{}, err
	}

	return r.mapModelToDomain(s)
}

func (r subscriptionRepository) FindByUid(uId uint64) (domain.Subscription, error) {
	var s subscription
	err := r.coll.Find(db.Cond{"user_id": uId}).One(&s)
	if err != nil {
		return domain.Subscription{}, err
	}

	return r.mapModelToDomain(s)
}

func (r subscriptionRepository) FindBySid(sId string) (domain.Subscription, error) {
	var s subscription
	err := r.coll.Find(db.Cond{"subscription_id": sId}).One(&s)
	if err != nil {
		return domain.Subscription{}, err
	}

	return r.mapModelToDomain(s)
}

func (r subscriptionRepository) Save(s domain.Subscription) (domain.Subscription, error) {
	sub, err := r.mapDomainToModel(s)
	if err != nil {
		return domain.Subscription{}, err
	}
	sub.CreatedDate, sub.UpdatedDate = time.Now(), time.Now()
	err = r.coll.InsertReturning(&sub)
	if err != nil {
		return domain.Subscription{}, err
	}

	return r.mapModelToDomain(sub)
}

func (r subscriptionRepository) Update(s domain.Subscription) (domain.Subscription, error) {
	sub, err := r.mapDomainToModel(s)
	if err != nil {
		return domain.Subscription{}, err
	}
	sub.UpdatedDate = time.Now()
	err = r.coll.Find(db.Cond{"id": s.Id}).Update(&sub)
	if err != nil {
		return domain.Subscription{}, err
	}

	return r.mapModelToDomain(sub)
}

func (r subscriptionRepository) mapDomainToModel(d domain.Subscription) (subscription, error) {
	cardDataJSON, err := json.Marshal(d.CardData)
	if err != nil {
		return subscription{}, err
	}
	return subscription{
		Id:              d.Id,
		UserId:          d.UserId,
		CustomerId:      d.CustomerId,
		SubscriptionId:  d.SubscriptionId,
		Price:           d.Price,
		Currency:        d.Currency,
		CardData:        cardDataJSON,
		Status:          d.Status,
		Paused:          d.Paused,
		NextPaymentDate: d.NextPaymentDate,
		CreatedDate:     d.CreatedDate,
		UpdatedDate:     d.UpdatedDate,
		DeletedDate:     d.DeletedDate,
	}, nil
}

func (r subscriptionRepository) mapModelToDomain(m subscription) (domain.Subscription, error) {
	var cardData domain.CardData
	err := json.Unmarshal(m.CardData, &cardData)
	if err != nil {
		return domain.Subscription{}, err
	}
	return domain.Subscription{
		Id:              m.Id,
		UserId:          m.UserId,
		CustomerId:      m.CustomerId,
		SubscriptionId:  m.SubscriptionId,
		Price:           m.Price,
		Currency:        m.Currency,
		CardData:        cardData,
		Status:          m.Status,
		Paused:          m.Paused,
		NextPaymentDate: m.NextPaymentDate,
		CreatedDate:     m.CreatedDate,
		UpdatedDate:     m.UpdatedDate,
		DeletedDate:     m.DeletedDate,
	}, nil
}
