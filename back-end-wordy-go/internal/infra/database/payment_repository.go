package database

import (
	"encoding/json"
	"github.com/stripe/stripe-go/v76"
	"github.com/upper/db/v4"
	"math"
	"time"
	"wordy-go-back/internal/domain"
)

const PaymentsTableName = "payments"

type payment struct {
	Id              uint64               `db:"id,omitempty"`
	UserId          uint64               `db:"user_id"`
	CustomerId      string               `db:"customer_id"`
	SubscriptionId  string               `db:"subscription_id"`
	InvoiceId       string               `db:"invoice_id"`
	PaymentIntentId string               `db:"payment_intent_id"`
	Price           int64                `db:"price"`
	Currency        stripe.Currency      `db:"currency"`
	Status          stripe.InvoiceStatus `db:"status"`
	InvoiceUrl      string               `db:"invoice_url"`
	CardData        []byte               `db:"card_data"`
	CreatedDate     time.Time            `db:"created_date"`
	UpdatedDate     time.Time            `db:"updated_date"`
}

type PaymentRepository interface {
	FindList(p domain.Pagination, uId uint64) (domain.Payments, error)
	Save(p domain.Payment) (domain.Payment, error)
	Update(p domain.Payment) (domain.Payment, error)
	Find(id uint64) (domain.Payment, error)
	FindByInvId(iId string) (domain.Payment, error)
}

type paymentRepository struct {
	coll db.Collection
	sess db.Session
}

func NewPaymentRepository(dbSession db.Session) PaymentRepository {
	return paymentRepository{
		coll: dbSession.Collection(PaymentsTableName),
		sess: dbSession,
	}
}

func (r paymentRepository) FindList(p domain.Pagination, uId uint64) (domain.Payments, error) {
	var fs []payment
	query := r.coll.Find(db.Cond{"user_id": uId}).OrderBy("-updated_date")

	res := query.Paginate(uint(p.CountPerPage))
	err := res.Page(uint(p.Page)).All(&fs)
	if err != nil {
		return domain.Payments{}, err
	}

	payments, err := r.mapModelToDomainPagination(fs)
	if err != nil {
		return domain.Payments{}, err
	}

	totalCount, err := res.TotalEntries()
	if err != nil {
		return domain.Payments{}, err
	}

	payments.Total = totalCount
	payments.Pages = uint(math.Ceil(float64(payments.Total) / float64(p.CountPerPage)))

	return payments, nil
}

func (r paymentRepository) Save(p domain.Payment) (domain.Payment, error) {
	pm, err := r.mapDomainToModel(p)
	if err != nil {
		return domain.Payment{}, err
	}

	pm.CreatedDate, pm.UpdatedDate = time.Now(), time.Now()
	err = r.coll.InsertReturning(&pm)
	if err != nil {
		return domain.Payment{}, err
	}

	return r.mapModelToDomain(pm)
}

func (r paymentRepository) Update(p domain.Payment) (domain.Payment, error) {
	pm, err := r.mapDomainToModel(p)
	if err != nil {
		return domain.Payment{}, err
	}

	pm.UpdatedDate = time.Now()
	err = r.coll.Find(db.Cond{"id": pm.Id}).Update(&pm)
	if err != nil {
		return domain.Payment{}, err
	}

	return r.mapModelToDomain(pm)
}

func (r paymentRepository) Find(id uint64) (domain.Payment, error) {
	var p payment
	err := r.coll.Find(db.Cond{"id": id}).One(&p)
	if err != nil {
		return domain.Payment{}, err
	}

	return r.mapModelToDomain(p)
}

func (r paymentRepository) FindByInvId(iId string) (domain.Payment, error) {
	var p payment
	err := r.coll.Find(db.Cond{"invoice_id": iId}).One(&p)
	if err != nil {
		return domain.Payment{}, err
	}

	return r.mapModelToDomain(p)
}

func (r paymentRepository) mapDomainToModel(d domain.Payment) (payment, error) {
	cardDataJSON, err := json.Marshal(d.CardData)
	if err != nil {
		return payment{}, err
	}
	return payment{
		Id:              d.Id,
		UserId:          d.UserId,
		CustomerId:      d.CustomerId,
		SubscriptionId:  d.SubscriptionId,
		InvoiceId:       d.InvoiceId,
		PaymentIntentId: d.PaymentIntentId,
		Price:           d.Price,
		Currency:        d.Currency,
		Status:          d.Status,
		InvoiceUrl:      d.InvoiceUrl,
		CardData:        cardDataJSON,
		CreatedDate:     d.CreatedDate,
		UpdatedDate:     d.UpdatedDate,
	}, nil
}

func (r paymentRepository) mapModelToDomain(m payment) (domain.Payment, error) {
	var cardData domain.CardData
	err := json.Unmarshal(m.CardData, &cardData)
	if err != nil {
		return domain.Payment{}, err
	}
	return domain.Payment{
		Id:              m.Id,
		UserId:          m.UserId,
		CustomerId:      m.CustomerId,
		SubscriptionId:  m.SubscriptionId,
		InvoiceId:       m.InvoiceId,
		PaymentIntentId: m.PaymentIntentId,
		Price:           m.Price,
		Currency:        m.Currency,
		Status:          m.Status,
		InvoiceUrl:      m.InvoiceUrl,
		CardData:        cardData,
		CreatedDate:     m.CreatedDate,
		UpdatedDate:     m.UpdatedDate,
	}, nil
}

func (r paymentRepository) mapModelToDomainPagination(ps []payment) (domain.Payments, error) {
	payments := make([]domain.Payment, len(ps))
	var err error
	for i, f := range ps {
		payments[i], err = r.mapModelToDomain(f)
		if err != nil {
			return domain.Payments{}, err
		}
	}
	return domain.Payments{Items: payments}, nil
}
