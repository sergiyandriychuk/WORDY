package database

import (
	"github.com/upper/db/v4"
	"time"
	"wordy-go-back/internal/domain"
)

const UsersTableName = "users"

type user struct {
	Id          uint64          `db:"id,omitempty"`
	Name        string          `db:"name"`
	Email       string          `db:"email"`
	Password    string          `db:"password"`
	CustomerId  *string         `db:"customer_id"`
	SocialId    *string         `db:"social_id,omitempty"`
	SocialName  *string         `db:"social_name,omitempty"`
	From        domain.LangCode `db:"from"`
	To          domain.LangCode `db:"to"`
	Avatar      *string         `db:"avatar"`
	CreatedDate time.Time       `db:"created_date,omitempty"`
	UpdatedDate time.Time       `db:"updated_date,omitempty"`
	DeletedDate *time.Time      `db:"deleted_date,omitempty"`
}

type UserRepository interface {
	FindByEmail(email string) (domain.User, error)
	Save(user domain.User) (domain.User, error)
	FindById(id uint64) (domain.User, error)
	FindByCustomerId(cId string) (domain.User, error)
	Update(user domain.User) (domain.User, error)
	Delete(id uint64) error
}

type userRepository struct {
	coll db.Collection
	sess db.Session
}

func NewUserRepository(dbSession db.Session) UserRepository {
	return userRepository{
		coll: dbSession.Collection(UsersTableName),
		sess: dbSession,
	}
}

func (r userRepository) FindByEmail(email string) (domain.User, error) {
	var u user
	err := r.coll.Find(db.Cond{"email": email, "deleted_date": nil}).One(&u)
	if err != nil {
		return domain.User{}, err
	}

	return r.mapModelToDomain(u), nil
}

func (r userRepository) Save(user domain.User) (domain.User, error) {
	u := r.mapDomainToModel(user)
	u.CreatedDate, u.UpdatedDate = time.Now(), time.Now()
	err := r.coll.InsertReturning(&u)
	if err != nil {
		return domain.User{}, err
	}
	return r.mapModelToDomain(u), nil
}

func (r userRepository) FindById(id uint64) (domain.User, error) {
	var u user
	err := r.coll.Find(db.Cond{"id": id}).One(&u)
	if err != nil {
		return domain.User{}, err
	}
	return r.mapModelToDomain(u), nil
}

func (r userRepository) FindByCustomerId(cId string) (domain.User, error) {
	var u user
	err := r.coll.Find(db.Cond{"customer_id": cId}).One(&u)
	if err != nil {
		return domain.User{}, err
	}
	return r.mapModelToDomain(u), nil
}

func (r userRepository) Update(user domain.User) (domain.User, error) {
	u := r.mapDomainToModel(user)
	u.UpdatedDate = time.Now()
	err := r.coll.Find(db.Cond{"id": u.Id}).Update(&u)
	if err != nil {
		return domain.User{}, err
	}
	return r.mapModelToDomain(u), nil
}

func (r userRepository) Delete(id uint64) error {
	return r.coll.Find(db.Cond{"id": id, "deleted_date": nil}).Update(map[string]interface{}{"deleted_date": time.Now()})
}

func (r userRepository) mapDomainToModel(d domain.User) user {
	return user{
		Id:          d.Id,
		Name:        d.Name,
		Email:       d.Email,
		Password:    d.Password,
		CustomerId:  d.CustomerId,
		SocialId:    d.SocialId,
		SocialName:  d.SocialName,
		From:        d.From,
		To:          d.To,
		Avatar:      d.Avatar,
		CreatedDate: d.CreatedDate,
		UpdatedDate: d.UpdatedDate,
		DeletedDate: d.DeletedDate,
	}
}

func (r userRepository) mapModelToDomain(m user) domain.User {
	return domain.User{
		Id:          m.Id,
		Name:        m.Name,
		Email:       m.Email,
		Password:    m.Password,
		CustomerId:  m.CustomerId,
		SocialId:    m.SocialId,
		SocialName:  m.SocialName,
		From:        m.From,
		To:          m.To,
		Avatar:      m.Avatar,
		CreatedDate: m.CreatedDate,
		UpdatedDate: m.UpdatedDate,
		DeletedDate: m.DeletedDate,
	}
}
