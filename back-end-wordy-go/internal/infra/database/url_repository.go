package database

import (
	"github.com/upper/db/v4"
	"math"
	"time"
	"wordy-go-back/internal/domain"
)

const UrlsTableName = "urls"

type url struct {
	Id          uint64          `db:"id,omitempty"`
	UserId      uint64          `db:"user_id"`
	Domain      string          `db:"domain"`
	Url         string          `db:"url"`
	From        domain.LangCode `db:"from"`
	To          domain.LangCode `db:"to"`
	Enabled     bool            `db:"enabled"`
	CreatedDate time.Time       `db:"created_date"`
	UpdatedDate time.Time       `db:"updated_date"`
}

type UrlRepository interface {
	FindById(id uint64) (domain.Url, error)
	FindList(p domain.Pagination, uf UrlFilters) (domain.Urls, error)
	FindByUserId(uId uint64) ([]domain.Url, error)
	Save(u domain.Url) (domain.Url, error)
	Update(u domain.Url) (domain.Url, error)
	Delete(u domain.Url) error
}

type urlRepository struct {
	coll db.Collection
	sess db.Session
}

func NewUrlRepository(dbSession db.Session) UrlRepository {
	return urlRepository{
		coll: dbSession.Collection(UrlsTableName),
		sess: dbSession,
	}
}

func (r urlRepository) FindById(id uint64) (domain.Url, error) {
	var u url
	err := r.coll.Find(db.Cond{"id": id}).One(&u)
	if err != nil {
		return domain.Url{}, err
	}
	return r.mapModelToDomain(u), nil
}

type UrlFilters struct {
	Search string
	From   domain.LangCode
	To     domain.LangCode
	Sort   string
	UId    uint64
	Domain string
}

func (r urlRepository) FindList(p domain.Pagination, uf UrlFilters) (domain.Urls, error) {
	var us []url
	query := r.coll.Find(db.Cond{"user_id": uf.UId})

	if uf.Domain != "" {
		query = query.And("domain = ?", uf.Domain)
	}

	if uf.From != "" {
		query = query.And("\"from\" = ?", uf.From)
	}

	if uf.To != "" {
		query = query.And("\"to\" = ?", uf.To)
	}

	if uf.Search != "" {
		query = query.And("url LIKE ?", "%"+uf.Search+"%")
	}

	if uf.Sort == "url" {
		query = query.OrderBy("url")
	} else {
		query = query.OrderBy("-updated_date")
	}

	res := query.Paginate(uint(p.CountPerPage))
	err := res.Page(uint(p.Page)).All(&us)
	if err != nil {
		return domain.Urls{}, err
	}

	urls := r.mapModelToDomainPagination(us)

	totalCount, err := res.TotalEntries()
	if err != nil {
		return domain.Urls{}, err
	}

	urls.Total = totalCount
	urls.Pages = uint(math.Ceil(float64(urls.Total) / float64(p.CountPerPage)))

	return urls, nil
}

func (r urlRepository) FindByUserId(uId uint64) ([]domain.Url, error) {
	var u []url
	err := r.coll.
		Find(db.Cond{"user_id": uId}).
		OrderBy("updated_date").
		All(&u)
	if err != nil {
		return nil, err
	}

	urls := r.mapModelToDomainCollection(u)
	return urls, nil
}

func (r urlRepository) Save(u domain.Url) (domain.Url, error) {
	ur := r.mapDomainToModel(u)
	ur.CreatedDate, ur.UpdatedDate = time.Now(), time.Now()
	err := r.coll.InsertReturning(&ur)
	if err != nil {
		return domain.Url{}, err
	}

	return r.mapModelToDomain(ur), nil
}

func (r urlRepository) Update(u domain.Url) (domain.Url, error) {
	ur := r.mapDomainToModel(u)
	ur.UpdatedDate = time.Now()
	err := r.coll.Find(db.Cond{"id": ur.Id}).Update(&ur)
	if err != nil {
		return domain.Url{}, err
	}

	return r.mapModelToDomain(ur), nil
}

func (r urlRepository) Delete(u domain.Url) error {
	err := r.coll.Find(db.Cond{"id": u.Id}).Delete()
	return err
}

func (r urlRepository) mapDomainToModel(d domain.Url) url {
	return url{
		Id:          d.Id,
		UserId:      d.UserId,
		Domain:      d.Domain,
		Url:         d.Url,
		From:        d.From,
		To:          d.To,
		Enabled:     d.Enabled,
		CreatedDate: d.CreatedDate,
		UpdatedDate: d.UpdatedDate,
	}
}

func (r urlRepository) mapModelToDomain(m url) domain.Url {
	return domain.Url{
		Id:          m.Id,
		UserId:      m.UserId,
		Domain:      m.Domain,
		Url:         m.Url,
		From:        m.From,
		To:          m.To,
		Enabled:     m.Enabled,
		CreatedDate: m.CreatedDate,
		UpdatedDate: m.UpdatedDate,
	}
}

func (r urlRepository) mapModelToDomainPagination(us []url) domain.Urls {
	urls := make([]domain.Url, len(us))
	for i, u := range us {
		urls[i] = r.mapModelToDomain(u)
	}
	return domain.Urls{Items: urls}
}

func (r urlRepository) mapModelToDomainCollection(us []url) []domain.Url {
	urls := make([]domain.Url, len(us))
	for i, u := range us {
		urls[i] = r.mapModelToDomain(u)
	}
	return urls
}
