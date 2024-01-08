package domain

import "time"

type Url struct {
	Id          uint64
	UserId      uint64
	Domain      string
	Url         string
	From        LangCode
	To          LangCode
	Enabled     bool
	CreatedDate time.Time
	UpdatedDate time.Time
}

type Urls struct {
	Items []Url
	Total uint64
	Pages uint
}

func (u Url) GetUserId() uint64 {
	return u.UserId
}
