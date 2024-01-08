package resources

import (
	"wordy-go-back/internal/domain"
)

type UrlDto struct {
	Id      uint64 `json:"id"`
	UserId  uint64 `json:"userId"`
	Domain  string `json:"domain"`
	Url     string `json:"url"`
	From    string `json:"from"`
	To      string `json:"to"`
	Enabled bool   `json:"enabled"`
}

type UrlsDto struct {
	Items []UrlDto `json:"items"`
	Total uint64   `json:"total"`
	Pages uint     `json:"pages"`
}

func (d UrlDto) DomainToDto(u domain.Url) UrlDto {
	return UrlDto{
		Id:      u.Id,
		UserId:  u.UserId,
		Domain:  u.Domain,
		Url:     u.Url,
		From:    string(u.From),
		To:      string(u.To),
		Enabled: u.Enabled,
	}
}

func (d UrlDto) DomainToDtoPagination(us domain.Urls) UrlsDto {
	urls := make([]UrlDto, len(us.Items))
	for i := range us.Items {
		urls[i] = d.DomainToDto(us.Items[i])
	}

	return UrlsDto{Items: urls, Pages: us.Pages, Total: us.Total}
}

func (d UrlDto) DomainToDtoCollection(us []domain.Url) []UrlDto {
	urls := make([]UrlDto, len(us))
	for i, u := range us {
		urls[i] = d.DomainToDto(u)
	}

	return urls
}
