package controllers

import (
	"log"
	"net/http"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/http/requests"
	"wordy-go-back/internal/infra/http/resources"
)

type WordController struct {
	wordService app.WordService
}

func NewWordController(ws app.WordService) WordController {
	return WordController{
		wordService: ws,
	}
}

func (c WordController) WordTranslations() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		transLang := domain.LangCode(r.URL.Query().Get("trans_lang"))
		word, err := requests.Bind(r, requests.TranslateRequest{}, domain.Word{})
		if err != nil {
			log.Printf("WordController: %s", err)
			BadRequest(w, err)
			return
		}

		translations, err := c.wordService.Translate(word, transLang)
		if err != nil {
			log.Printf("WordController: %s", err)
			BadRequest(w, err)
			return
		}

		var tDto resources.TranslationsDto
		Success(w, tDto.DomainToDto(translations))
	}
}
