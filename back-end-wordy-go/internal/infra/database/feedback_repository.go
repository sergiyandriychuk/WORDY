package database

import (
	"github.com/upper/db/v4"
	"math"
	"time"
	"wordy-go-back/internal/domain"
)

const FeedbacksTableName = "feedbacks"

type feedback struct {
	Id          uint64                `db:"id,omitempty"`
	UserId      uint64                `db:"user_id"`
	Subject     string                `db:"subject"`
	Message     string                `db:"message"`
	Url         string                `db:"url"`
	From        domain.LangCode       `db:"from"`
	Status      domain.FeedbackStatus `db:"status"`
	CreatedDate time.Time             `db:"created_date"`
	UpdatedDate time.Time             `db:"updated_date"`
}

type FeedbackRepository interface {
	FindById(id uint64) (domain.Feedback, error)
	FindList(p domain.Pagination, ff FeedbackFilters) (domain.Feedbacks, error)
	FindByUserId(uId uint64) ([]domain.Feedback, error)
	Save(f domain.Feedback) (domain.Feedback, error)
	Update(f domain.Feedback) (domain.Feedback, error)
	Delete(f domain.Feedback) error
}

type feedbackRepository struct {
	coll db.Collection
	sess db.Session
}

func NewFeedBackRepository(dbSession db.Session) FeedbackRepository {
	return feedbackRepository{
		coll: dbSession.Collection(FeedbacksTableName),
		sess: dbSession,
	}
}

func (r feedbackRepository) FindById(id uint64) (domain.Feedback, error) {
	var f feedback
	err := r.coll.Find(db.Cond{"id": id}).One(&f)
	if err != nil {
		return domain.Feedback{}, err
	}
	return r.mapModelToDomain(f), nil
}

type FeedbackFilters struct {
	Status domain.FeedbackStatus
	UId    uint64
}

func (r feedbackRepository) FindList(p domain.Pagination, ff FeedbackFilters) (domain.Feedbacks, error) {
	var fs []feedback
	query := r.coll.Find()

	if ff.Status != "" {
		query = query.And("status = ?", ff.Status)
	}

	if ff.UId != 0 {
		query = query.And("user_id = ?", ff.UId)
	}

	query.OrderBy("updated_date")

	res := query.Paginate(uint(p.CountPerPage))
	err := res.Page(uint(p.Page)).All(&fs)
	if err != nil {
		return domain.Feedbacks{}, err
	}

	feedbacks := r.mapModelToDomainPagination(fs)

	totalCount, err := res.TotalEntries()
	if err != nil {
		return domain.Feedbacks{}, err
	}

	feedbacks.Total = totalCount
	feedbacks.Pages = uint(math.Ceil(float64(feedbacks.Total) / float64(p.CountPerPage)))

	return feedbacks, nil
}

func (r feedbackRepository) FindByUserId(uId uint64) ([]domain.Feedback, error) {
	var fs []feedback
	err := r.coll.
		Find(db.Cond{"user_id": uId}).
		OrderBy("updated_date").
		All(&fs)
	if err != nil {
		return nil, err
	}

	feedbacks := r.mapModelToDomainCollection(fs)
	return feedbacks, nil
}

func (r feedbackRepository) Save(f domain.Feedback) (domain.Feedback, error) {
	fb := r.mapDomainToModel(f)
	fb.CreatedDate, fb.UpdatedDate = time.Now(), time.Now()
	err := r.coll.InsertReturning(&fb)
	if err != nil {
		return domain.Feedback{}, err
	}

	return r.mapModelToDomain(fb), nil
}

func (r feedbackRepository) Update(f domain.Feedback) (domain.Feedback, error) {
	fb := r.mapDomainToModel(f)
	fb.UpdatedDate = time.Now()
	err := r.coll.Find(db.Cond{"id": fb.Id}).Update(&fb)
	if err != nil {
		return domain.Feedback{}, err
	}

	return r.mapModelToDomain(fb), nil
}

func (r feedbackRepository) Delete(f domain.Feedback) error {
	err := r.coll.Find(db.Cond{"id": f.Id}).Delete()
	return err
}

func (r feedbackRepository) mapDomainToModel(d domain.Feedback) feedback {
	return feedback{
		Id:          d.Id,
		Subject:     d.Subject,
		Message:     d.Message,
		UserId:      d.UserId,
		Url:         d.Url,
		From:        d.From,
		Status:      d.Status,
		CreatedDate: d.CreatedDate,
		UpdatedDate: d.UpdatedDate,
	}
}

func (r feedbackRepository) mapModelToDomain(m feedback) domain.Feedback {
	return domain.Feedback{
		Id:          m.Id,
		Subject:     m.Subject,
		Message:     m.Message,
		UserId:      m.UserId,
		Url:         m.Url,
		From:        m.From,
		Status:      m.Status,
		CreatedDate: m.CreatedDate,
		UpdatedDate: m.UpdatedDate,
	}
}

func (r feedbackRepository) mapModelToDomainPagination(fs []feedback) domain.Feedbacks {
	feedbacks := make([]domain.Feedback, len(fs))
	for i, f := range fs {
		feedbacks[i] = r.mapModelToDomain(f)
	}
	return domain.Feedbacks{Items: feedbacks}
}

func (r feedbackRepository) mapModelToDomainCollection(fs []feedback) []domain.Feedback {
	feedbacks := make([]domain.Feedback, len(fs))
	for i, u := range fs {
		feedbacks[i] = r.mapModelToDomain(u)
	}
	return feedbacks
}
