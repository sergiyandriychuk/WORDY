package resources

import (
	"wordy-go-back/internal/domain"
)

type TranslationsDto struct {
	Translations []TranslationDto `json:"translations"`
}

type TranslationDto struct {
	Word     string          `json:"word"`
	LangCode domain.LangCode `json:"langCode"`
}

func (d TranslationDto) DomainToDto(word domain.Word) TranslationDto {
	return TranslationDto{
		Word:     word.Word,
		LangCode: word.LangCode,
	}
}

func (d TranslationsDto) DomainToDto(words []domain.Word) TranslationsDto {
	ts := make([]TranslationDto, len(words))
	for i, w := range words {
		var tDto TranslationDto
		ts[i] = tDto.DomainToDto(w)
	}
	return TranslationsDto{Translations: ts}
}
