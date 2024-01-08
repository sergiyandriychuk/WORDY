package app

import (
	"context"
	"github.com/Azure/azure-sdk-for-go/services/cognitiveservices/v3.0/translatortext"
	"log"
	"strings"
	"wordy-go-back/internal/domain"
)

type WordService interface {
	Translate(w domain.Word, transLang domain.LangCode) ([]domain.Word, error)
}

type wordService struct {
	atc         translatortext.TranslatorClient
	gApiEnabled bool
	aApiEnabled bool
}

func NewWordService(
	azureTranslateClient translatortext.TranslatorClient,
	azureApiEnabled bool,
) WordService {
	return wordService{
		atc:         azureTranslateClient,
		aApiEnabled: azureApiEnabled,
	}
}

func (s wordService) Translate(w domain.Word, transLang domain.LangCode) ([]domain.Word, error) {
	textInputs := []translatortext.DictionaryLookupTextInput{
		{
			Text: &w.Word,
		},
	}

	ctx := context.Background()
	resp, err := s.atc.DictionaryLookup(ctx, string(w.LangCode), string(transLang), textInputs, "")
	if err != nil {
		log.Printf("WordService->Translate->s.atc.DictionaryLookup: %s", err)
		return nil, err
	}

	resultItem := *resp.Value
	translations := *resultItem[0].Translations

	words := make([]domain.Word, len(translations))
	for i, translation := range translations {
		wrd := strings.ToLower(*translation.NormalizedTarget)
		if wrd != w.Word {
			words[i] = domain.Word{
				Word:     wrd,
				LangCode: transLang,
			}
		}
	}

	return words, nil
}
