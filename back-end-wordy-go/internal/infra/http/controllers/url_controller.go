package controllers

import (
	"log"
	"net/http"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/database"
	"wordy-go-back/internal/infra/http/requests"
	"wordy-go-back/internal/infra/http/resources"
)

type UrlController struct {
	urlService app.UrlService
}

func NewUrlController(us app.UrlService) UrlController {
	return UrlController{
		urlService: us,
	}
}

func (c UrlController) Save() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		url, err := requests.Bind(r, requests.AddUrlRequest{}, domain.Url{})
		if err != nil {
			log.Printf("UrlController: %s", err)
			BadRequest(w, err)
		}

		user := r.Context().Value(UserKey).(domain.User)
		url.UserId = user.Id
		url.Enabled = true
		url, err = c.urlService.Save(url)
		if err != nil {
			log.Printf("UrlController: %s", err)
			BadRequest(w, err)
			return
		}

		var urlDto resources.UrlDto
		Created(w, urlDto.DomainToDto(url))
	}
}

func (c UrlController) Find() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		url := GetPathValFromCtx[domain.Url](r.Context())
		Success(w, resources.UrlDto{}.DomainToDto(url))
	}
}

func (c UrlController) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		urlReq, err := requests.Bind(r, requests.UpdateUrlRequest{}, domain.Url{})
		if err != nil {
			log.Printf("UrlController: %s", err)
			BadRequest(w, err)
			return
		}

		url := GetPathValFromCtx[domain.Url](r.Context())
		if urlReq.Domain != "" {
			url.Domain = urlReq.Domain
		}
		if urlReq.Url != "" {
			url.Url = urlReq.Url
		}
		if urlReq.From != "" {
			url.From = urlReq.From
		}
		if urlReq.To != "" {
			url.To = urlReq.To
		}
		url, err = c.urlService.Update(url)
		if err != nil {
			log.Printf("UrlController: %s", err)
			InternalServerError(w, err)
			return
		}

		var urlDto resources.UrlDto
		Success(w, urlDto.DomainToDto(url))
	}
}

func (c UrlController) Toggle() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		url := GetPathValFromCtx[domain.Url](r.Context())

		urlReq, err := requests.Bind(r, requests.ToggleUrlRequest{}, domain.Url{})
		if err != nil {
			log.Printf("UrlController: %s", err)
			BadRequest(w, err)
			return
		}

		url.Enabled = urlReq.Enabled
		url, err = c.urlService.Update(url)
		if err != nil {
			log.Printf("UrlController: %s", err)
			InternalServerError(w, err)
			return
		}

		var urlDto resources.UrlDto
		Success(w, urlDto.DomainToDto(url))
	}
}

func (c UrlController) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		url := GetPathValFromCtx[domain.Url](r.Context())

		err := c.urlService.Delete(url)
		if err != nil {
			log.Printf("UrlController: %s", err)
			InternalServerError(w, err)
			return
		}

		Ok(w)
	}
}

func (c UrlController) FindList() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pagination, err := requests.DecodePaginationQuery(r)
		if err != nil {
			log.Printf("UrlController: %s", err)
			BadRequest(w, err)
			return
		}

		d := r.URL.Query().Get("domain")
		search := r.URL.Query().Get("search")
		from := r.URL.Query().Get("from")
		to := r.URL.Query().Get("to")
		sort := r.URL.Query().Get("sort")

		u := r.Context().Value(UserKey).(domain.User)

		uf := database.UrlFilters{
			Search: search,
			From:   domain.LangCode(from),
			To:     domain.LangCode(to),
			UId:    u.Id,
			Sort:   sort,
			Domain: d,
		}

		urls, err := c.urlService.FindList(pagination, uf)
		if err != nil {
			log.Printf("UrlController: %s", err)
			InternalServerError(w, err)
			return
		}

		var urlDto resources.UrlDto
		Success(w, urlDto.DomainToDtoPagination(urls))
	}
}
