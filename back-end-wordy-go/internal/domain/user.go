package domain

import (
	"time"
)

type User struct {
	Id           uint64
	Name         string
	Email        string
	Password     string
	CustomerId   *string
	SocialId     *string
	SocialName   *string
	From         LangCode
	To           LangCode
	Avatar       *string
	Urls         []Url
	Subscription Subscription
	CreatedDate  time.Time
	UpdatedDate  time.Time
	DeletedDate  *time.Time
}

type Users struct {
	Items []User
	Total uint64
	Pages uint
}

type ChangePassword struct {
	OldPassword string
	NewPassword string
}

func (u User) GetUserId() uint64 {
	return u.Id
}
