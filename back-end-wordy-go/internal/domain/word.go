package domain

type LangCode string

const (
	English   LangCode = "en"
	Spanish   LangCode = "es"
	Ukrainian LangCode = "uk"
	German    LangCode = "de"
	Polish    LangCode = "pl"
)

type Word struct {
	Word     string
	LangCode LangCode
}
