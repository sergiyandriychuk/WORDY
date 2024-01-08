package requests

import (
	"wordy-go-back/internal/domain"
)

type TranslateRequest struct {
	Word     string          `json:"word" validate:"required"`
	LangCode domain.LangCode `json:"langCode" validate:"required"`
}

func (r TranslateRequest) ToDomainModel() (interface{}, error) {
	return domain.Word{
		Word:     r.Word,
		LangCode: r.LangCode,
	}, nil
}
