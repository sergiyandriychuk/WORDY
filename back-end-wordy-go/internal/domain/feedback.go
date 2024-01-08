package domain

import "time"

type Feedback struct {
	Id          uint64
	UserId      uint64
	Subject     string
	Message     string
	Url         string
	From        LangCode
	Status      FeedbackStatus
	CreatedDate time.Time
	UpdatedDate time.Time
}

type Feedbacks struct {
	Items []Feedback
	Total uint64
	Pages uint
}

type FeedbackStatus string

const (
	FeedbackNew       FeedbackStatus = "NEW"
	FeedbackProcessed FeedbackStatus = "PROCESSED"
)
