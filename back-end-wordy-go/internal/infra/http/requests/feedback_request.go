package requests

import "wordy-go-back/internal/domain"

type FeedbackRequest struct {
	Subject string          `json:"subject" validate:"required"`
	Message string          `json:"message"`
	Url     string          `json:"url"`
	From    domain.LangCode `json:"from"`
}

func (r FeedbackRequest) ToDomainModel() (interface{}, error) {
	return domain.Feedback{
		Subject: r.Subject,
		Message: r.Message,
		Url:     r.Url,
		From:    r.From,
	}, nil
}
