package domain

import (
	"errors"
	"github.com/google/uuid"
	"strings"
)

type Session struct {
	UserId uint64
	UUID   uuid.UUID
}

type AuthByProvider struct {
	Provider    Provider
	AccessToken string
}

type Provider int

const (
	ProviderGoogle Provider = iota + 1
)

var (
	Providers = map[Provider]string{
		ProviderGoogle: "GOOGLE",
	}
	ProvidersMap = map[string]Provider{
		"GOOGLE": ProviderGoogle,
	}
	ProvidersURL = map[Provider]string{
		ProviderGoogle: "https://www.googleapis.com/oauth2/v3/userinfo",
	}
)

func ParseProvider(r string) (Provider, error) {
	provider, ok := ProvidersMap[strings.ToUpper(strings.TrimSpace(r))]
	if !ok {
		return 0, errors.New("unknown provider")
	}
	return provider, nil
}

func (p Provider) String() string {
	return Providers[p]
}
