package requests

import "wordy-go-back/internal/domain"

type AddUrlRequest struct {
	Domain string          `json:"domain" validate:"gte=1"`
	Url    string          `json:"url" validate:"gte=1"`
	From   domain.LangCode `json:"from" validate:"len=2"`
	To     domain.LangCode `json:"to" validate:"len=2"`
}

type UpdateUrlRequest struct {
	Domain string          `json:"domain"`
	Url    string          `json:"url"`
	From   domain.LangCode `json:"from" validate:"max=2"`
	To     domain.LangCode `json:"to" validate:"max=2"`
}

type ToggleUrlRequest struct {
	Enabled bool `json:"enabled"`
}

func (r AddUrlRequest) ToDomainModel() (interface{}, error) {
	return domain.Url{
		Domain: r.Domain,
		Url:    r.Url,
		From:   r.From,
		To:     r.To,
	}, nil
}

func (r UpdateUrlRequest) ToDomainModel() (interface{}, error) {
	return domain.Url{
		Domain: r.Domain,
		Url:    r.Url,
		From:   r.From,
		To:     r.To,
	}, nil
}

func (r ToggleUrlRequest) ToDomainModel() (interface{}, error) {
	return domain.Url{
		Enabled: r.Enabled,
	}, nil
}
